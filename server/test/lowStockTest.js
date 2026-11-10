const http = require('http');

function makeRequest({ method = 'GET', path, token = null, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5055,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: JSON.parse(raw),
            });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

async function runTests() {
  console.log('=== Starting NaveedPOS Low Stock Alert & Quick Restock Test Suite ===\n');

  // 1. Unauthenticated Request Guard
  console.log('1. Testing Unauthenticated Request Security...');
  const unauthRes = await makeRequest({
    method: 'GET',
    path: '/api/products/low-stock',
  });
  assert(
    unauthRes.status === 401,
    `Unauthenticated GET /api/products/low-stock is rejected with 401 (Received: ${unauthRes.status})`
  );

  // 2. Authenticate Store Admin (Al-Madina / tenant_1)
  console.log('\n2. Authenticating Store Admin (Al-Madina Mart)...');
  const loginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'admin@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(loginRes.status === 200, `Store Admin login returns 200 (Received: ${loginRes.status})`);
  assert(!!loginRes.body.token, 'JWT token returned in login response');
  const token = loginRes.body.token;
  const storeUser = loginRes.body.user;
  assert(storeUser.role === 'STORE_ADMIN', `User role is STORE_ADMIN`);

  // 3. Fetch Low Stock Products
  console.log('\n3. Testing GET /api/products/low-stock...');
  const lowStockRes = await makeRequest({
    method: 'GET',
    path: '/api/products/low-stock',
    token,
  });
  assert(lowStockRes.status === 200, `GET /api/products/low-stock returns 200`);
  assert(lowStockRes.body.success === true, `Response body success is true`);
  assert(Array.isArray(lowStockRes.body.items), `Items is an array`);
  assert(typeof lowStockRes.body.count === 'number', `Count is returned as a number: ${lowStockRes.body.count}`);

  const items = lowStockRes.body.items;
  console.log(`  Found ${items.length} low stock items in catalog`);

  // Verify Sorting: Stock Quantity ascending (Out of stock = 0 at the top)
  let isSorted = true;
  for (let i = 0; i < items.length - 1; i++) {
    if (items[i].stockQuantity > items[i + 1].stockQuantity) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, `Low stock items are sorted in ascending order of stockQuantity (lowest stock first)`);

  // Verify threshold condition for every item
  let allBelowThreshold = true;
  items.forEach((item) => {
    const limit = item.lowStockAlert || item.lowStockThreshold || 5;
    if (item.stockQuantity > limit) {
      allBelowThreshold = false;
    }
  });
  assert(allBelowThreshold, `Every returned product has stockQuantity <= lowStockAlert threshold`);

  // 4. Test Validation on Quick Restock
  console.log('\n4. Testing Validation on PATCH /api/products/:id/restock...');
  if (items.length > 0) {
    const targetProduct = items[0];

    // Invalid negative quantity
    const negQtyRes = await makeRequest({
      method: 'PATCH',
      path: `/api/products/${targetProduct._id}/restock`,
      token,
      body: { quantityToAdd: -5 },
    });
    assert(negQtyRes.status === 400, `Negative quantityToAdd is rejected with 400 (Received: ${negQtyRes.status})`);

    // Zero quantity
    const zeroQtyRes = await makeRequest({
      method: 'PATCH',
      path: `/api/products/${targetProduct._id}/restock`,
      token,
      body: { quantityToAdd: 0 },
    });
    assert(zeroQtyRes.status === 400, `Zero quantityToAdd is rejected with 400 (Received: ${zeroQtyRes.status})`);

    // Missing quantity
    const missingQtyRes = await makeRequest({
      method: 'PATCH',
      path: `/api/products/${targetProduct._id}/restock`,
      token,
      body: {},
    });
    assert(missingQtyRes.status === 400, `Missing quantityToAdd is rejected with 400 (Received: ${missingQtyRes.status})`);

    // 5. Test Successful Inline Quick Restock
    console.log(`\n5. Executing Quick Restock on Product "${targetProduct.title}" (Current Stock: ${targetProduct.stockQuantity})...`);
    const initialStock = Number(targetProduct.stockQuantity || 0);
    const qtyToAdd = 30;
    const newCost = 175.5;

    const restockRes = await makeRequest({
      method: 'PATCH',
      path: `/api/products/${targetProduct._id}/restock`,
      token,
      body: {
        quantityToAdd: qtyToAdd,
        newCostPrice: newCost,
      },
    });

    assert(restockRes.status === 200, `PATCH /api/products/:id/restock returns 200 OK`);
    assert(restockRes.body.success === true, `Response success is true`);
    assert(
      restockRes.body.product.stockQuantity === initialStock + qtyToAdd,
      `Stock incremented correctly: ${initialStock} + ${qtyToAdd} = ${restockRes.body.product.stockQuantity}`
    );
    assert(
      restockRes.body.product.costPrice === newCost,
      `Wholesale costPrice updated correctly to ${newCost}`
    );

    // 6. Verify Low Stock List Update
    console.log('\n6. Verifying Updated Catalog Status...');
    const recheckRes = await makeRequest({
      method: 'GET',
      path: '/api/products/low-stock',
      token,
    });
    const recheckItems = recheckRes.body.items;
    const targetInList = recheckItems.find((p) => p._id === targetProduct._id);
    const threshold = targetProduct.lowStockAlert || targetProduct.lowStockThreshold || 5;

    if (initialStock + qtyToAdd > threshold) {
      assert(
        !targetInList,
        `Restocked product (${initialStock + qtyToAdd} units > threshold ${threshold}) is no longer in low-stock alert list`
      );
    } else {
      assert(
        targetInList && targetInList.stockQuantity === initialStock + qtyToAdd,
        `Restocked product stock updated to ${initialStock + qtyToAdd}`
      );
    }
  }

  // 7. Verify Multi-Tenant Scoping
  console.log('\n7. Testing Multi-Tenant Scoping for Restock...');
  // Non-existent or other tenant ID
  const invalidIdRes = await makeRequest({
    method: 'PATCH',
    path: `/api/products/prod_non_existent_999/restock`,
    token,
    body: { quantityToAdd: 10 },
  });
  assert(
    invalidIdRes.status === 404,
    `Restocking product belonging to another tenant or non-existent ID returns 404 (Received: ${invalidIdRes.status})`
  );

  // 8. Verify Dashboard Metrics Integration
  console.log('\n8. Testing Dashboard Metrics Integration (GET /api/reports/dashboard-metrics)...');
  const dashRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/dashboard-metrics?period=today',
    token,
  });
  assert(dashRes.status === 200, `Dashboard metrics endpoint returns 200`);
  assert(dashRes.body.success === true, `Dashboard response success is true`);
  assert(Array.isArray(dashRes.body.lowStockProducts), `lowStockProducts array is present on dashboard response`);
  assert(
    dashRes.body.summary && typeof dashRes.body.summary.lowStockCount === 'number',
    `summary.lowStockCount is present and numeric: ${dashRes.body.summary?.lowStockCount}`
  );
  assert(
    dashRes.body.summary.lowStockCount === dashRes.body.lowStockProducts.length,
    `summary.lowStockCount matches lowStockProducts.length (${dashRes.body.summary.lowStockCount})`
  );

  console.log('\n=== ALL LOW STOCK ALERT & QUICK RESTOCK TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
