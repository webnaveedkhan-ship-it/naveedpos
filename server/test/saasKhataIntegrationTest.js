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

async function runSaaSAndKhataTests() {
  console.log('======================================================================');
  console.log('🚀 Starting NaveedPOS Multi-Tenant SaaS & Customer Khata Test Suite');
  console.log('======================================================================\n');

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
    // ------------------------------------------------------------------------
    // 1. Super Admin Authentication (Naveed)
    // ------------------------------------------------------------------------
    console.log('[Test 1] Super Admin (Naveed) Authentication');
    const superAdminLogin = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'naveed@naveedpos.com', password: 'admin123' }
    );
    assert(superAdminLogin.status === 200, 'Super admin login returned HTTP 200');
    assert(superAdminLogin.data.user.role === 'SUPER_ADMIN', 'Super admin role is SUPER_ADMIN');
    assert(superAdminLogin.data.user.tenantId === null, 'Super admin has tenantId: null (global SaaS scope)');
    const superAdminToken = superAdminLogin.data.token;

    // ------------------------------------------------------------------------
    // 2. SaaS Platform Metrics
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Super Admin SaaS Platform Metrics');
    const platformStats = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/tenants/metrics/platform',
      method: 'GET',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(platformStats.status === 200, 'Platform metrics returned HTTP 200');
    assert(platformStats.data.stats.totalTenants >= 3, `Total retail tenants registered: ${platformStats.data.stats.totalTenants}`);
    assert(platformStats.data.stats.activeTenants >= 2, `Active retail tenants: ${platformStats.data.stats.activeTenants}`);

    // ------------------------------------------------------------------------
    // 3. Super Admin Tenant Provisioning
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Super Admin Provisions New Store Tenant');
    const newStoreSlug = `test-mart-${Date.now()}`;
    const createTenantRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/tenants',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
      },
      {
        name: 'Peshawar Test Mart',
        slug: newStoreSlug,
        ownerName: 'Shahid Khan',
        ownerEmail: `shahid_${Date.now()}@testmart.pk`,
        ownerPassword: 'password123',
        phone: '0311-9876543',
        subscriptionMonths: 6,
      }
    );
    assert(createTenantRes.status === 201, 'New store tenant provisioned with HTTP 201');
    assert(createTenantRes.data.tenant.name === 'Peshawar Test Mart', 'Tenant name saved correctly');
    const newTenantId = createTenantRes.data.tenant._id;

    // ------------------------------------------------------------------------
    // 4. Store Admin Authentication (Al-Madina Superstore)
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Store Admin (Al-Madina) Authentication');
    const storeAdminLogin = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@naveedpos.com', password: 'admin123' }
    );
    assert(storeAdminLogin.status === 200, 'Store Admin logged in successfully');
    assert(storeAdminLogin.data.user.tenantId === 'tenant_1', 'Store Admin scoped to tenant_1');
    const storeToken = storeAdminLogin.data.token;

    // ------------------------------------------------------------------------
    // 5. Khata Customer Listing & Retrieval
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Khata Customer Directory (Al-Madina Store)');
    const khataListRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/khata/customers',
      method: 'GET',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    assert(khataListRes.status === 200, 'Customer Khata list returned HTTP 200');
    assert(khataListRes.data.customers.length >= 3, `Found ${khataListRes.data.customers.length} Khata accounts`);

    // ------------------------------------------------------------------------
    // 6. Khata Customer Creation
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] Create New Khata Customer Account');
    const testCustPhone = `0300-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const createCustRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/khata/customers',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storeToken}`,
        },
      },
      {
        name: 'Tariq Mehmood',
        phone: testCustPhone,
        address: 'House 42, Sector F-10/2, Islamabad',
        creditLimit: 5000,
        initialDebt: 1000,
      }
    );
    assert(createCustRes.status === 201, 'Khata customer created with HTTP 201');
    assert(createCustRes.data.customer.totalDebt === 1000, 'Initial debt recorded as Rs. 1,000');
    assert(createCustRes.data.customer.creditLimit === 5000, 'Credit limit set to Rs. 5,000');
    const testCustomerId = createCustRes.data.customer._id;

    // ------------------------------------------------------------------------
    // 7. Khata Credit Limit Enforcement Guard
    // ------------------------------------------------------------------------
    console.log('\n[Test 7] Khata Credit Limit Enforcement Check');
    // Find a product
    const prodsRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/products?all=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    const testProd = prodsRes.data.products[0];

    // Attempt an order that will exceed the Rs. 5,000 limit (current debt 1000 + 4500 = 5500 > 5000)
    const excessOrderRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storeToken}`,
        },
      },
      {
        items: [
          {
            product: testProd._id,
            title: testProd.title,
            sku: testProd.sku,
            price: 4500,
            quantity: 1,
            subtotal: 4500,
          },
        ],
        subtotal: 4500,
        grandTotal: 4500,
        paymentMethod: 'KHATA',
        customer: {
          khataId: testCustomerId,
          name: 'Tariq Mehmood',
          phone: testCustPhone,
        },
      }
    );
    assert(excessOrderRes.status === 400, 'Order exceeding credit limit rejected with HTTP 400');
    assert(
      excessOrderRes.data.message && excessOrderRes.data.message.includes('Credit Limit Exceeded'),
      `Correct alert message returned: "${excessOrderRes.data.message?.slice(0, 50)}..."`
    );

    // ------------------------------------------------------------------------
    // 8. Legitimate Khata (Udhar) POS Order Processing
    // ------------------------------------------------------------------------
    console.log('\n[Test 8] Complete Valid POS Khata (Udhar) Sale & Stock Decrement');
    const initialStock = testProd.stockQuantity;
    const saleAmount = 1500; // 1000 debt + 1500 = 2500 <= 5000 limit

    const validKhataOrder = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storeToken}`,
        },
      },
      {
        items: [
          {
            product: testProd._id,
            title: testProd.title,
            sku: testProd.sku,
            price: 750,
            quantity: 2,
            subtotal: 1500,
          },
        ],
        subtotal: 1500,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: 1500,
        paymentMethod: 'KHATA',
        customer: {
          khataId: testCustomerId,
          name: 'Tariq Mehmood',
          phone: testCustPhone,
        },
      }
    );
    assert(validKhataOrder.status === 201, 'Khata Udhar order completed with HTTP 201');
    assert(validKhataOrder.data.order.paymentMethod === 'KHATA', 'Order payment method recorded as KHATA');
    assert(validKhataOrder.data.order.paymentDetails.previousDebt === 1000, 'Previous debt tracked as Rs. 1,000');
    assert(validKhataOrder.data.order.paymentDetails.balanceAfter === 2500, 'New balance tracked as Rs. 2,500');

    // Check customer ledger updated
    const customerAfterOrder = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/khata/customers/${testCustomerId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    assert(customerAfterOrder.data.customer.totalDebt === 2500, 'Customer running debt updated to Rs. 2,500');
    const latestTx = customerAfterOrder.data.customer.transactions[0];
    assert(latestTx.type === 'UDHAR_GIVEN', 'Ledger transaction type is UDHAR_GIVEN');
    assert(latestTx.amount === 1500, 'Ledger transaction debit amount is Rs. 1,500');

    // Check stock was decremented
    const prodsAfterRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/products/${testProd._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    assert(
      prodsAfterRes.data.product.stockQuantity === initialStock - 2,
      `Product stock decremented from ${initialStock} to ${prodsAfterRes.data.product.stockQuantity}`
    );

    // ------------------------------------------------------------------------
    // 9. Khata Wasooli / Payment Received
    // ------------------------------------------------------------------------
    console.log('\n[Test 9] Record Khata Wasooli (Payment Received)');
    const wasooliRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: `/api/khata/customers/${testCustomerId}/payment`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storeToken}`,
        },
      },
      {
        amount: 1500,
        paymentMethod: 'CASH',
        notes: 'Partial payment settled in cash',
      }
    );
    assert(wasooliRes.status === 200, 'Wasooli payment recorded with HTTP 200');
    assert(wasooliRes.data.customer.totalDebt === 1000, 'Total debt decremented from Rs. 2,500 to Rs. 1,000');
    const wasooliTx = wasooliRes.data.customer.transactions[0];
    assert(wasooliTx.type === 'PAYMENT_RECEIVED', 'Ledger transaction type is PAYMENT_RECEIVED');
    assert(wasooliTx.balanceAfter === 1000, 'Balance after Wasooli is Rs. 1,000');

    // ------------------------------------------------------------------------
    // 10. Khata Dashboard Metrics
    // ------------------------------------------------------------------------
    console.log('\n[Test 10] Khata Dashboard Metrics Verification');
    const khataMetricsRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/khata/metrics',
      method: 'GET',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    assert(khataMetricsRes.status === 200, 'Khata metrics returned HTTP 200');
    assert(khataMetricsRes.data.metrics.totalMarketDebt > 0, `Total Market Udhar: Rs. ${khataMetricsRes.data.metrics.totalMarketDebt.toLocaleString()}`);
    assert(khataMetricsRes.data.metrics.debtorCount > 0, `Active Debtors: ${khataMetricsRes.data.metrics.debtorCount}`);
    assert(khataMetricsRes.data.metrics.todayWasooli >= 1500, `Today's Wasooli: Rs. ${khataMetricsRes.data.metrics.todayWasooli.toLocaleString()}`);

    // ------------------------------------------------------------------------
    // 11. Multi-Tenant Data Isolation Test
    // ------------------------------------------------------------------------
    console.log('\n[Test 11] Tenant Data Isolation (Karachi Store vs Al-Madina)');
    const karachiLogin = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'khan@naveedpos.com', password: 'admin123' }
    );
    assert(karachiLogin.status === 200, 'Karachi Store Admin authenticated');
    const karachiToken = karachiLogin.data.token;

    // Karachi store retrieves products
    const karachiProds = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/products?all=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${karachiToken}` },
    });
    assert(karachiProds.status === 200, 'Karachi products retrieved');
    // Ensure test product from Al-Madina is NOT visible to Karachi store
    const leakedProd = karachiProds.data.products.find((p) => p._id === testProd._id);
    assert(!leakedProd, 'Al-Madina product is NOT visible in Karachi store catalog (Strict Isolation)');

    // Ensure Tariq Mehmood's Khata is NOT visible to Karachi store
    const karachiKhataRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/khata/customers',
      method: 'GET',
      headers: { Authorization: `Bearer ${karachiToken}` },
    });
    const leakedCustomer = karachiKhataRes.data.customers.find((c) => c._id === testCustomerId);
    assert(!leakedCustomer, 'Customer Khata is NOT visible to other store tenants (Strict Isolation)');

    // ------------------------------------------------------------------------
    // 12. Super Admin Tenant Suspension & TenantGuard Enforcement
    // ------------------------------------------------------------------------
    console.log('\n[Test 12] Super Admin Store Suspension & TenantGuard HTTP 403 Enforcement');
    // Suspend Al-Madina Superstore
    const suspendRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/tenants/tenant_1/status',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
      },
      { status: 'suspended' }
    );
    assert(suspendRes.status === 200, 'Super admin suspended tenant_1 with HTTP 200');

    // Attempt access with Al-Madina Store Token
    const blockedAccessRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/products?all=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    assert(blockedAccessRes.status === 403, 'TenantGuard blocked suspended tenant with HTTP 403 Forbidden');
    assert(
      blockedAccessRes.data.message && blockedAccessRes.data.message.includes('suspended'),
      `Suspension message verified: "${blockedAccessRes.data.message}"`
    );

    // Reactivate Al-Madina Superstore
    const reactivateRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/tenants/tenant_1/status',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
      },
      { status: 'active' }
    );
    assert(reactivateRes.status === 200, 'Super admin reactivated tenant_1 with HTTP 200');

    // Verify access restored
    const restoredAccessRes = await request({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/products?all=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    assert(restoredAccessRes.status === 200, 'Access immediately restored upon reactivation (HTTP 200)');

    console.log('\n======================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test execution error:', err);
    process.exit(1);
  }
}

runSaaSAndKhataTests();