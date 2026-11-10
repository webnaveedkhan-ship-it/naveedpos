const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

// Import express app
const app = require('../src/server');

const TEST_PORT = 5055;

function run() {
  const server = app.listen(TEST_PORT, async () => {
    console.log(`\n🧪 Test Server listening in-process on http://127.0.0.1:${TEST_PORT}\n`);

    const request = (options, data = null) => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: TEST_PORT,
            ...options,
          },
          (res) => {
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
          }
        );
        req.on('error', reject);
        if (data) {
          req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
      });
    };

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
      console.log('======================================================================');
      console.log('🚀 Running NaveedPOS Multi-Tenant SaaS & Customer Khata In-Process Test');
      console.log('======================================================================\n');

      // 1. Health check
      console.log('[Test 1] API Server Health Check');
      const health = await request({ path: '/api/health', method: 'GET' });
      assert(health.status === 200 && health.data.status === 'online', 'Health endpoint reports online status');

      // 2. Super Admin Authentication (Naveed)
      console.log('\n[Test 2] Super Admin (Naveed) Global Authentication');
      const superLogin = await request(
        { path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { email: 'naveed@naveedpos.com', password: 'admin123' }
      );
      assert(superLogin.status === 200, 'Super admin login successful');
      assert(superLogin.data.user.role === 'SUPER_ADMIN', 'Role is strictly SUPER_ADMIN');
      assert(superLogin.data.user.tenantId === null, 'Super admin tenantId is null (global control plane)');
      const superToken = superLogin.data.token;

      // 3. SaaS Platform Metrics
      console.log('\n[Test 3] Super Admin Platform Metrics');
      const platformStats = await request({
        path: '/api/tenants/metrics/platform',
        method: 'GET',
        headers: { Authorization: `Bearer ${superToken}` },
      });
      assert(platformStats.status === 200, 'Platform metrics retrieved successfully');
      assert(platformStats.data.stats.totalTenants >= 3, `Total store tenants: ${platformStats.data.stats.totalTenants}`);
      assert(platformStats.data.stats.activeTenants >= 2, `Active paying tenants: ${platformStats.data.stats.activeTenants}`);

      // 4. Provision New Store Tenant
      console.log('\n[Test 4] Provision New Store Tenant via SaaS Control Plane');
      const newTenantRes = await request(
        {
          path: '/api/tenants',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
        },
        {
          name: 'Multan Cash & Carry',
          slug: `multan-mart-${Date.now()}`,
          ownerName: 'Rashid Ali',
          ownerEmail: `rashid_${Date.now()}@multanmart.pk`,
          ownerPassword: 'password123',
          phone: '0300-7654321',
          subscriptionMonths: 12,
        }
      );
      assert(newTenantRes.status === 201, 'New store tenant provisioned with HTTP 201');
      assert(newTenantRes.data.tenant.name === 'Multan Cash & Carry', 'Tenant name saved correctly');
      const provisionedTenantId = newTenantRes.data.tenant._id;

      // 5. Store Admin Authentication (Al-Madina Superstore)
      console.log('\n[Test 5] Store Admin Authentication & Tenant Scoping');
      const storeLogin = await request(
        { path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { email: 'admin@naveedpos.com', password: 'admin123' }
      );
      assert(storeLogin.status === 200, 'Store Admin authenticated');
      assert(storeLogin.data.user.tenantId === 'tenant_1', 'Scoped to Al-Madina Superstore (tenant_1)');
      const storeToken = storeLogin.data.token;

      // 6. Khata Customer Listing
      console.log('\n[Test 6] Khata Customer Directory');
      const khataList = await request({
        path: '/api/khata/customers',
        method: 'GET',
        headers: { Authorization: `Bearer ${storeToken}` },
      });
      assert(khataList.status === 200, 'Khata customer directory retrieved');
      assert(khataList.data.customers.length >= 3, `Loaded ${khataList.data.customers.length} credit customers`);

      // 7. Create New Khata Customer Account
      console.log('\n[Test 7] Register New Khata Customer Account');
      const uniquePhone = `0301-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const createCustomerRes = await request(
        {
          path: '/api/khata/customers',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken}` },
        },
        {
          name: 'Bilal Ahmad',
          phone: uniquePhone,
          address: 'House #55, Street 12, F-8/3, Islamabad',
          creditLimit: 6000,
          initialDebt: 1500,
        }
      );
      assert(createCustomerRes.status === 201, 'Customer account created with HTTP 201');
      assert(createCustomerRes.data.customer.totalDebt === 1500, 'Initial debt recorded as Rs. 1,500');
      assert(createCustomerRes.data.customer.creditLimit === 6000, 'Credit limit set to Rs. 6,000');
      const customerId = createCustomerRes.data.customer._id;

      // 8. Credit Limit Enforcement Guard
      console.log('\n[Test 8] Credit Limit Enforcement Guard Check');
      const productsRes = await request({
        path: '/api/products?all=true',
        method: 'GET',
        headers: { Authorization: `Bearer ${storeToken}` },
      });
      const sampleProd = productsRes.data.products[0];

      // Current debt: 1500, limit: 6000. Try adding 5000 (total 6500 > 6000)
      const creditExceedRes = await request(
        {
          path: '/api/orders',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken}` },
        },
        {
          items: [{ product: sampleProd._id, title: sampleProd.title, sku: sampleProd.sku, price: 5000, quantity: 1, subtotal: 5000 }],
          subtotal: 5000,
          grandTotal: 5000,
          paymentMethod: 'KHATA',
          customer: { khataId: customerId, name: 'Bilal Ahmad', phone: uniquePhone },
        }
      );
      assert(creditExceedRes.status === 400, 'Order exceeding credit limit rejected with HTTP 400');
      assert(
        creditExceedRes.data.message && creditExceedRes.data.message.includes('Credit Limit Exceeded'),
        `Enforcement alert message: "${creditExceedRes.data.message.slice(0, 50)}..."`
      );

      // 9. Valid Khata (Udhar) POS Sale
      console.log('\n[Test 9] Complete Valid POS Khata (Udhar) Sale');
      const preStock = sampleProd.stockQuantity;
      const validOrderRes = await request(
        {
          path: '/api/orders',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken}` },
        },
        {
          items: [{ product: sampleProd._id, title: sampleProd.title, sku: sampleProd.sku, price: sampleProd.price, quantity: 2, subtotal: sampleProd.price * 2 }],
          subtotal: sampleProd.price * 2,
          grandTotal: sampleProd.price * 2,
          paymentMethod: 'KHATA',
          customer: { khataId: customerId, name: 'Bilal Ahmad', phone: uniquePhone },
        }
      );
      assert(validOrderRes.status === 201, 'Khata sale completed with HTTP 201');
      assert(validOrderRes.data.order.paymentMethod === 'KHATA', 'Payment method is KHATA');
      assert(validOrderRes.data.order.paymentDetails.previousDebt === 1500, 'Previous debt is Rs. 1,500');
      const expectedBalanceAfter = 1500 + sampleProd.price * 2;
      assert(validOrderRes.data.order.paymentDetails.balanceAfter === expectedBalanceAfter, `New debt balance is Rs. ${expectedBalanceAfter}`);

      // Verify stock decrement
      const prodCheck = await request({
        path: `/api/products/${sampleProd._id}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${storeToken}` },
      });
      assert(prodCheck.data.product.stockQuantity === preStock - 2, `Product stock decremented by 2 (Now: ${prodCheck.data.product.stockQuantity})`);

      // 10. Record Khata Wasooli (Payment Received)
      console.log('\n[Test 10] Record Khata Wasooli (Payment Received)');
      const wasooliAmount = 1000;
      const wasooliRes = await request(
        {
          path: `/api/khata/customers/${customerId}/payment`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken}` },
        },
        {
          amount: wasooliAmount,
          paymentMethod: 'CASH',
          notes: 'Customer cash settlement at counter',
        }
      );
      assert(wasooliRes.status === 200, 'Wasooli recorded with HTTP 200');
      assert(wasooliRes.data.customer.totalDebt === expectedBalanceAfter - wasooliAmount, `Total debt decremented by Rs. ${wasooliAmount}`);
      const latestTx = wasooliRes.data.customer.transactions[0];
      assert(latestTx.type === 'PAYMENT_RECEIVED', 'Transaction type recorded as PAYMENT_RECEIVED');

      // 11. Khata Metrics Dashboard
      console.log('\n[Test 11] Khata Dashboard Analytics Metrics');
      const metricsRes = await request({
        path: '/api/khata/metrics',
        method: 'GET',
        headers: { Authorization: `Bearer ${storeToken}` },
      });
      assert(metricsRes.status === 200, 'Khata metrics endpoint returned HTTP 200');
      assert(metricsRes.data.metrics.totalMarketDebt > 0, `Total Outstanding Market Udhar: Rs. ${metricsRes.data.metrics.totalMarketDebt.toLocaleString()}`);
      assert(metricsRes.data.metrics.todayWasooli >= wasooliAmount, `Today Wasooli: Rs. ${metricsRes.data.metrics.todayWasooli.toLocaleString()}`);

      // 12. Tenant Data Isolation (Karachi store vs Al-Madina)
      console.log('\n[Test 12] Multi-Tenant Data Isolation (Karachi vs Islamabad)');
      const karachiLogin = await request(
        { path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { email: 'khan@naveedpos.com', password: 'admin123' }
      );
      assert(karachiLogin.status === 200, 'Karachi Store Admin authenticated');
      const karachiToken = karachiLogin.data.token;

      const karachiKhataRes = await request({
        path: '/api/khata/customers',
        method: 'GET',
        headers: { Authorization: `Bearer ${karachiToken}` },
      });
      const isCustomerLeaked = karachiKhataRes.data.customers.some((c) => c._id === customerId);
      assert(!isCustomerLeaked, 'Khata customer is strictly isolated (NOT leaked to Karachi store)');

      // 13. Tenant Suspension & Access Guard Check
      console.log('\n[Test 13] Super Admin Suspension & TenantGuard Enforcement');
      // Suspend tenant_1
      const suspendRes = await request(
        {
          path: '/api/tenants/tenant_1/status',
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
        },
        { status: 'suspended' }
      );
      assert(suspendRes.status === 200, 'Super admin suspended tenant_1');

      // Attempt access by suspended store
      const blockedRes = await request({
        path: '/api/products?all=true',
        method: 'GET',
        headers: { Authorization: `Bearer ${storeToken}` },
      });
      assert(blockedRes.status === 403, 'TenantGuard blocked suspended tenant with HTTP 403 Forbidden');
      assert(blockedRes.data.message && blockedRes.data.message.includes('suspended'), 'Clear suspension reason communicated in response');

      // Reactivate tenant_1
      const reactivateRes = await request(
        {
          path: '/api/tenants/tenant_1/status',
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
        },
        { status: 'active' }
      );
      assert(reactivateRes.status === 200, 'Super admin reactivated tenant_1');

      // Verify access restored
      const restoredRes = await request({
        path: '/api/products?all=true',
        method: 'GET',
        headers: { Authorization: `Bearer ${storeToken}` },
      });
      assert(restoredRes.status === 200, 'Store access successfully restored (HTTP 200)');

      console.log('\n======================================================================');
      console.log(`🎉 ALL TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
      console.log('======================================================================\n');
    } catch (e) {
      console.error('💥 Test failed with exception:', e);
      failed++;
    } finally {
      server.close(() => {
        console.log('Test server closed cleanly.');
        process.exit(failed > 0 ? 1 : 0);
      });
    }
  });
}

run();