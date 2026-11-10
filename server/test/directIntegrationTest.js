const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

// Force in-memory store for test determinism
global.useMemoryStore = true;
const memoryStore = require('../src/config/memoryStore');

const authController = require('../src/controllers/authController');
const tenantController = require('../src/controllers/tenantController');
const khataController = require('../src/controllers/khataController');
const orderController = require('../src/controllers/orderController');
const productController = require('../src/controllers/productController');
const tenantGuard = require('../src/middleware/tenantGuard');

// Mock response builder
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    cookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    cookie(name, val, opt) {
      this.cookies[name] = val;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    send(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runDirectTests() {
  console.log('======================================================================');
  console.log('🚀 Running NaveedPOS Multi-Tenant SaaS & Customer Khata Test Suite');
  console.log('======================================================================\n');

  // Initialize in-memory seed data
  await memoryStore.init();

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
    console.log('[Test 1] Super Admin (Naveed) Global Platform Authentication');
    const superReq = {
      body: { email: 'naveed@naveedpos.com', password: 'admin123' },
    };
    const superRes = createMockRes();
    await authController.login(superReq, superRes);

    assert(superRes.statusCode === 200, 'Super admin login successful with HTTP 200');
    assert(superRes.data.user.role === 'SUPER_ADMIN', 'User role is SUPER_ADMIN');
    assert(superRes.data.user.tenantId === null, 'Super admin tenantId is null (global scope)');
    const superUser = superRes.data.user;

    // ------------------------------------------------------------------------
    // 2. Super Admin SaaS Platform Metrics
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] SaaS Platform Metrics & Store Counts');
    const statsReq = { user: superUser };
    const statsRes = createMockRes();
    await tenantController.getPlatformStats(statsReq, statsRes);

    assert(statsRes.statusCode === 200, 'Platform metrics returned HTTP 200');
    assert(statsRes.data.stats.totalTenants >= 3, `Total store tenants registered: ${statsRes.data.stats.totalTenants}`);
    assert(statsRes.data.stats.activeTenants >= 2, `Active paying tenants: ${statsRes.data.stats.activeTenants}`);

    // ------------------------------------------------------------------------
    // 3. Super Admin Provisions New Store Tenant
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Super Admin Provisions New Store Tenant');
    const newStoreReq = {
      user: superUser,
      body: {
        name: 'Quetta Central Mart',
        slug: `quetta-mart-${Date.now()}`,
        ownerName: 'Mirza Baig',
        ownerEmail: `quetta_${Date.now()}@mart.pk`,
        ownerPassword: 'password123',
        phone: '0333-1239876',
        subscriptionMonths: 12,
      },
    };
    const newStoreRes = createMockRes();
    await tenantController.createTenant(newStoreReq, newStoreRes);

    assert(newStoreRes.statusCode === 201, 'New store tenant created with HTTP 201');
    assert(newStoreRes.data.tenant.name === 'Quetta Central Mart', 'Tenant name saved correctly');
    const newTenant = newStoreRes.data.tenant;

    // ------------------------------------------------------------------------
    // 4. Store Admin Authentication (Al-Madina Superstore)
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Store Admin (Al-Madina) Authentication');
    const storeAdminReq = {
      body: { email: 'admin@naveedpos.com', password: 'admin123' },
    };
    const storeAdminRes = createMockRes();
    await authController.login(storeAdminReq, storeAdminRes);

    assert(storeAdminRes.statusCode === 200, 'Store Admin authenticated with HTTP 200');
    assert(storeAdminRes.data.user.role === 'STORE_ADMIN', 'Role is STORE_ADMIN');
    assert(storeAdminRes.data.user.tenantId === 'tenant_1', 'Scoped to Al-Madina Superstore (tenant_1)');
    const storeUser = storeAdminRes.data.user;

    // ------------------------------------------------------------------------
    // 5. Khata Customer Listing
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Khata Customer Directory (tenant_1)');
    const khataListReq = { user: storeUser, query: {} };
    const khataListRes = createMockRes();
    await khataController.getCustomers(khataListReq, khataListRes);

    assert(khataListRes.statusCode === 200, 'Khata customer directory retrieved with HTTP 200');
    assert(khataListRes.data.customers.length >= 3, `Found ${khataListRes.data.customers.length} credit customers`);

    // ------------------------------------------------------------------------
    // 6. Create New Khata Customer with Credit Limit
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] Register New Khata Customer Account');
    const uniquePhone = `0300-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const createCustomerReq = {
      user: storeUser,
      body: {
        name: 'Kamran Akmal',
        phone: uniquePhone,
        address: 'Street 4, Sector G-9/1, Islamabad',
        creditLimit: 5000,
        initialDebt: 1200,
      },
    };
    const createCustomerRes = createMockRes();
    await khataController.createCustomer(createCustomerReq, createCustomerRes);

    assert(createCustomerRes.statusCode === 201, 'Khata customer created with HTTP 201');
    assert(createCustomerRes.data.customer.totalDebt === 1200, 'Initial debt recorded as Rs. 1,200');
    assert(createCustomerRes.data.customer.creditLimit === 5000, 'Credit limit configured as Rs. 5,000');
    const newKhataCustomer = createCustomerRes.data.customer;

    // ------------------------------------------------------------------------
    // 7. Credit Limit Enforcement Guard
    // ------------------------------------------------------------------------
    console.log('\n[Test 7] Khata Credit Limit Enforcement Guard');
    const storeProduct = memoryStore.products.find((p) => p.tenantId === 'tenant_1');
    assert(storeProduct !== undefined, `Found product "${storeProduct?.title}" (Price: Rs. ${storeProduct?.price})`);

    // Attempt order that exceeds limit: current debt 1200 + 4000 = 5200 > 5000 limit
    const exceedOrderReq = {
      user: storeUser,
      body: {
        items: [
          {
            product: storeProduct._id,
            title: storeProduct.title,
            sku: storeProduct.sku,
            price: 4000,
            quantity: 1,
            subtotal: 4000,
          },
        ],
        subtotal: 4000,
        grandTotal: 4000,
        paymentMethod: 'KHATA',
        customer: {
          khataId: newKhataCustomer._id,
          name: newKhataCustomer.name,
          phone: newKhataCustomer.phone,
        },
      },
    };
    const exceedOrderRes = createMockRes();
    await orderController.createOrder(exceedOrderReq, exceedOrderRes);

    assert(exceedOrderRes.statusCode === 400, 'Order exceeding credit limit rejected with HTTP 400');
    assert(
      exceedOrderRes.data.message && exceedOrderRes.data.message.includes('Credit Limit Exceeded'),
      `Rejection message: "${exceedOrderRes.data.message.slice(0, 48)}..."`
    );

    // ------------------------------------------------------------------------
    // 8. Legitimate Khata (Udhar) POS Order Processing & Stock Decrement
    // ------------------------------------------------------------------------
    console.log('\n[Test 8] Complete Valid POS Khata (Udhar) Sale & Stock Decrement');
    const stockBefore = storeProduct.stockQuantity;
    const saleQty = 2;
    const saleTotal = storeProduct.price * saleQty; // e.g. 450 * 2 = 900. Total debt will be 1200 + 900 = 2100 <= 5000

    const validOrderReq = {
      user: storeUser,
      body: {
        items: [
          {
            product: storeProduct._id,
            title: storeProduct.title,
            sku: storeProduct.sku,
            price: storeProduct.price,
            costPrice: storeProduct.costPrice,
            quantity: saleQty,
            subtotal: saleTotal,
          },
        ],
        subtotal: saleTotal,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: saleTotal,
        paymentMethod: 'KHATA',
        customer: {
          khataId: newKhataCustomer._id,
          name: newKhataCustomer.name,
          phone: newKhataCustomer.phone,
        },
      },
    };
    const validOrderRes = createMockRes();
    await orderController.createOrder(validOrderReq, validOrderRes);

    assert(validOrderRes.statusCode === 201, 'Khata order completed with HTTP 201');
    assert(validOrderRes.data.order.paymentMethod === 'KHATA', 'Order payment method is KHATA');
    assert(validOrderRes.data.order.paymentDetails.previousDebt === 1200, 'Previous debt recorded as Rs. 1,200');
    const expectedDebtAfterSale = 1200 + saleTotal;
    assert(
      validOrderRes.data.order.paymentDetails.balanceAfter === expectedDebtAfterSale,
      `New balance debt recorded as Rs. ${expectedDebtAfterSale}`
    );

    // Verify stock decrement
    assert(
      storeProduct.stockQuantity === stockBefore - saleQty,
      `Inventory stock decremented from ${stockBefore} to ${storeProduct.stockQuantity}`
    );

    // Verify customer ledger
    assert(
      newKhataCustomer.totalDebt === expectedDebtAfterSale,
      `Customer running debt balance updated to Rs. ${newKhataCustomer.totalDebt}`
    );
    const lastTx = newKhataCustomer.transactions[0];
    assert(lastTx.type === 'UDHAR_GIVEN', 'Ledger transaction type is UDHAR_GIVEN');
    assert(lastTx.amount === saleTotal, `Ledger transaction amount is Rs. ${saleTotal}`);

    // ------------------------------------------------------------------------
    // 9. Khata Wasooli (Payment Received)
    // ------------------------------------------------------------------------
    console.log('\n[Test 9] Record Khata Wasooli (Payment Received)');
    const wasooliAmount = 1000;
    const wasooliReq = {
      user: storeUser,
      params: { id: newKhataCustomer._id },
      body: {
        amount: wasooliAmount,
        paymentMethod: 'CASH',
        notes: 'Counter Cash Wasooli',
      },
    };
    const wasooliRes = createMockRes();
    await khataController.recordKhataPayment(wasooliReq, wasooliRes);

    assert(wasooliRes.statusCode === 200, 'Wasooli payment recorded with HTTP 200');
    const expectedFinalDebt = expectedDebtAfterSale - wasooliAmount;
    assert(
      wasooliRes.data.customer.totalDebt === expectedFinalDebt,
      `Customer total debt decremented to Rs. ${expectedFinalDebt}`
    );
    const paymentTx = wasooliRes.data.customer.transactions[0];
    assert(paymentTx.type === 'PAYMENT_RECEIVED', 'Transaction type recorded as PAYMENT_RECEIVED');
    assert(paymentTx.balanceAfter === expectedFinalDebt, `Running balance after Wasooli: Rs. ${expectedFinalDebt}`);

    // ------------------------------------------------------------------------
    // 10. Khata Dashboard Metrics
    // ------------------------------------------------------------------------
    console.log('\n[Test 10] Khata Dashboard Analytics Metrics');
    const metricsReq = { user: storeUser };
    const metricsRes = createMockRes();
    await khataController.getKhataMetrics(metricsReq, metricsRes);

    assert(metricsRes.statusCode === 200, 'Khata metrics retrieved with HTTP 200');
    assert(metricsRes.data.metrics.totalMarketDebt > 0, `Total Outstanding Market Udhar: Rs. ${metricsRes.data.metrics.totalMarketDebt.toLocaleString()}`);
    assert(metricsRes.data.metrics.totalDebtorsCount > 0, `Active Debtors Count: ${metricsRes.data.metrics.totalDebtorsCount}`);
    assert(metricsRes.data.metrics.todayWasooli >= wasooliAmount, `Today Wasooli: Rs. ${metricsRes.data.metrics.todayWasooli.toLocaleString()}`);

    // ------------------------------------------------------------------------
    // 11. Multi-Tenant Data Isolation Test
    // ------------------------------------------------------------------------
    console.log('\n[Test 11] Tenant Data Isolation (Karachi store vs Islamabad store)');
    const karachiUser = {
      _id: 'user_4',
      name: 'Khan Admin',
      email: 'khan@naveedpos.com',
      role: 'STORE_ADMIN',
      tenantId: 'tenant_2', // Khan Electronics (Karachi)
    };

    const karachiKhataReq = { user: karachiUser, query: {} };
    const karachiKhataRes = createMockRes();
    await khataController.getCustomers(karachiKhataReq, karachiKhataRes);

    const isCustomerLeaked = karachiKhataRes.data.customers.some((c) => c._id === newKhataCustomer._id);
    assert(!isCustomerLeaked, 'Al-Madina Khata customer is strictly isolated (NOT visible in Karachi store)');

    // ------------------------------------------------------------------------
    // 12. Super Admin Tenant Suspension & TenantGuard Enforcement
    // ------------------------------------------------------------------------
    console.log('\n[Test 12] Super Admin Store Suspension & TenantGuard HTTP 403 Enforcement');
    // Suspend tenant_1
    const suspendReq = {
      user: superUser,
      params: { id: 'tenant_1' },
      body: { status: 'suspended' },
    };
    const suspendRes = createMockRes();
    await tenantController.toggleTenantStatus(suspendReq, suspendRes);
    assert(suspendRes.statusCode === 200, 'Super admin suspended tenant_1 with HTTP 200');

    // Run tenantGuard on storeUser request
    let nextCalled = false;
    const guardReq = { user: storeUser };
    const guardRes = createMockRes();
    await tenantGuard(guardReq, guardRes, () => {
      nextCalled = true;
    });

    assert(guardRes.statusCode === 403, 'TenantGuard blocked suspended tenant with HTTP 403 Forbidden');
    assert(!nextCalled, 'Next middleware was NOT called (Request terminated)');
    assert(
      guardRes.data.message && guardRes.data.message.includes('suspended'),
      `Suspension reason correctly reported: "${guardRes.data.message}"`
    );

    // Reactivate tenant_1
    const reactivateReq = {
      user: superUser,
      params: { id: 'tenant_1' },
      body: { status: 'active' },
    };
    const reactivateRes = createMockRes();
    await tenantController.toggleTenantStatus(reactivateReq, reactivateRes);
    assert(reactivateRes.statusCode === 200, 'Super admin reactivated tenant_1 with HTTP 200');

    // Re-verify tenantGuard passes
    let reactivatedNext = false;
    const reactivatedGuardRes = createMockRes();
    await tenantGuard(guardReq, reactivatedGuardRes, () => {
      reactivatedNext = true;
    });
    assert(reactivatedNext === true, 'TenantGuard permitted access immediately upon reactivation');

    console.log('\n======================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test execution error:', err);
    process.exit(1);
  }
}

runDirectTests();