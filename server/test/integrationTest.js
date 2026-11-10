const http = require('http');

const request = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Starting End-to-End NaveedPOS Pakistani Currency (PKR) Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('[Test 1] Health Check');
    const health = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/health',
      method: 'GET',
    });
    assert(health.status === 200 && health.data.status === 'online', 'API server is online on port 5050');

    // 2. Cashier Login
    console.log('\n[Test 2] Cashier Authentication');
    const loginRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'cashier@naveedpos.com', password: 'cashier123' }
    );
    assert(loginRes.status === 200 && loginRes.data.token, 'Cashier logged in successfully & received JWT');
    const cashierToken = loginRes.data.token;

    // 3. Get Products (PKR Currency Verification)
    console.log('\n[Test 3] Product Catalog & PKR Pricing');
    const productsRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/products?all=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert(productsRes.status === 200 && productsRes.data.products.length > 0, `Loaded ${productsRes.data.products?.length} products`);
    const coldBrew = productsRes.data.products.find((p) => p.sku === 'BEV-001');
    assert(coldBrew && coldBrew.price === 450, `Cold Brew Coffee price is Rs. ${coldBrew?.price} (PKR)`);
    const initialColdBrewStock = coldBrew.stockQuantity;

    // 4. SKU Lookup
    console.log('\n[Test 4] Barcode / SKU Lookup');
    const skuRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/products/sku/BEV-001',
      method: 'GET',
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert(skuRes.status === 200 && skuRes.data.product.sku === 'BEV-001', 'SKU lookup finds product BEV-001');

    // 5. Create Order in PKR & Cash Payment
    console.log('\n[Test 5] POS Sale Transaction (Cash Tendered in PKR)');
    const orderPayload = {
      items: [
        {
          product: coldBrew._id,
          title: coldBrew.title,
          sku: coldBrew.sku,
          price: 450,
          costPrice: 260,
          quantity: 1,
          subtotal: 450,
        },
      ],
      subtotal: 450,
      taxRate: 5,
      taxAmount: 22.5,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      grandTotal: 472.5,
      paymentMethod: 'cash',
      paymentDetails: {
        cashTendered: 500, // Rs. 500 banknote
        changeGiven: 27.5, // Rs. 27.50 change
      },
      customer: { name: 'Tariq Mehmood', phone: '+92 300 7771234' },
      notes: 'Customer paid with Rs. 500 banknote',
    };

    const orderRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`,
        },
      },
      orderPayload
    );
    assert(orderRes.status === 201 && orderRes.data.order?.orderNumber, `Sale completed! Receipt #: ${orderRes.data.order?.orderNumber}`);
    assert(orderRes.data.order.grandTotal === 472.5, `Total amount: Rs. ${orderRes.data.order.grandTotal}`);
    assert(orderRes.data.order.paymentDetails.changeGiven === 27.5, `Change given: Rs. ${orderRes.data.order.paymentDetails.changeGiven}`);

    // 6. Check Stock Decrement
    console.log('\n[Test 6] Atomic Stock Decrement Verification');
    const updatedProdRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/products/sku/BEV-001',
      method: 'GET',
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const expectedStock = initialColdBrewStock - 1;
    assert(
      updatedProdRes.data.product.stockQuantity === expectedStock,
      `Cold brew stock decremented from ${initialColdBrewStock} to ${expectedStock}`
    );

    // 7. Stock Guard Check (Prevent overselling)
    console.log('\n[Test 7] Stock Guard (Oversell Prevention)');
    const oversellPayload = {
      items: [
        {
          product: coldBrew._id,
          title: coldBrew.title,
          sku: coldBrew.sku,
          price: 450,
          costPrice: 260,
          quantity: 9999, // Exceeds available stock
          subtotal: 450 * 9999,
        },
      ],
      subtotal: 450 * 9999,
      taxRate: 5,
      taxAmount: 0,
      grandTotal: 450 * 9999,
      paymentMethod: 'cash',
    };
    const oversellRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`,
        },
      },
      oversellPayload
    );
    assert(oversellRes.status === 400, 'Order rejected with 400 Bad Request due to insufficient stock');

    // 8. Admin Login & Dashboard Analytics
    console.log('\n[Test 8] Admin Authentication & Analytics Dashboard');
    const adminLoginRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@naveedpos.com', password: 'admin123' }
    );
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user.role === 'admin', 'Admin logged in successfully');
    const adminToken = adminLoginRes.data.token;

    const dashRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/analytics/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(dashRes.status === 200 && dashRes.data.summary.totalRevenue > 0, `Today Revenue: Rs. ${dashRes.data.summary.todayRevenue} (PKR)`);
    assert(dashRes.data.topSellingProducts.length > 0, `Top Selling Products tracked: ${dashRes.data.topSellingProducts.length} items`);

    // 9. Orders Log Listing
    console.log('\n[Test 9] Orders Log & Receipt Reprint Data');
    const ordersLog = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/orders',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(ordersLog.status === 200 && ordersLog.data.orders.length > 0, `Orders log returned ${ordersLog.data.orders.length} orders`);

    console.log('\n==================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
