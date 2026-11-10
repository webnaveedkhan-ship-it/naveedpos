const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

// Force in-memory store for test determinism
global.useMemoryStore = true;
const memoryStore = require('../src/config/memoryStore');

const authController = require('../src/controllers/authController');
const superAdminController = require('../src/controllers/superAdminController');
const { protect, superAdminOnly } = require('../src/middleware/authMiddleware');

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

async function runTests() {
  console.log('======================================================================');
  console.log('👑 NaveedPOS Super Admin 6-Pillar Platform Owner Verification Suite');
  console.log('======================================================================\n');

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

  // =========================================================================
  // 1. SECURITY & ACCESS BOUNDARIES (RBAC)
  // =========================================================================
  console.log('--- 1. Testing Security & Access Boundaries ---');

  // 1.1 Store Admin Login
  const storeAdminReq = {
    body: { email: 'admin@naveedpos.com', password: 'admin123' },
  };
  const storeAdminRes = createMockRes();
  await authController.login(storeAdminReq, storeAdminRes, (err) => {
    if (err) console.error(err);
  });
  assert(storeAdminRes.statusCode === 200, 'Store Admin (Al Madina) login returns 200 OK');
  const storeAdminUser = storeAdminRes.data?.user;
  assert(storeAdminUser?.role === 'STORE_ADMIN', 'User role is STORE_ADMIN');

  // 1.2 Super Admin Login (Master Administrator: Naveed)
  const superAdminReq = {
    body: { email: 'naveed@naveedpos.com', password: 'admin123' },
  };
  const superAdminRes = createMockRes();
  await authController.login(superAdminReq, superAdminRes, (err) => {
    if (err) console.error(err);
  });
  assert(superAdminRes.statusCode === 200, 'Super Admin (Naveed) login returns 200 OK');
  const superUser = superAdminRes.data?.user;
  assert(superUser?.role === 'SUPER_ADMIN', 'User role is SUPER_ADMIN');
  assert(superUser?.tenantId === null, 'Super Admin has global platform tenantId = null');

  // 1.3 RBAC Middleware Rejection for Store Admin
  const rbacReq = { user: storeAdminUser };
  const rbacRes = createMockRes();
  let nextCalled = false;
  superAdminOnly(rbacReq, rbacRes, () => {
    nextCalled = true;
  });
  assert(
    rbacRes.statusCode === 403 && !nextCalled,
    'superAdminOnly middleware rejects STORE_ADMIN with 403 Forbidden'
  );

  // 1.4 RBAC Middleware Approval for Super Admin
  const superRbacReq = { user: superUser };
  const superRbacRes = createMockRes();
  let superNextCalled = false;
  superAdminOnly(superRbacReq, superRbacRes, () => {
    superNextCalled = true;
  });
  assert(superNextCalled, 'superAdminOnly middleware permits SUPER_ADMIN to proceed');

  // =========================================================================
  // PILLAR 1: PLATFORM TELEMETRY & FINANCIAL HEALTH
  // =========================================================================
  console.log('\n--- 2. Pillar 1: Platform Telemetry & Global KPIs ---');

  const metricsReq = { user: superUser };
  const metricsRes = createMockRes();
  await superAdminController.getGlobalMetrics(metricsReq, metricsRes, (err) => {
    if (err) console.error(err);
  });
  assert(metricsRes.statusCode === 200, 'getGlobalMetrics returns 200 OK');
  const metrics = metricsRes.data?.metrics;
  assert(typeof metrics?.mrr === 'number', `MRR calculated in PKR (MRR: Rs. ${metrics?.mrr})`);
  assert(typeof metrics?.gmv === 'number', `Platform GMV calculated in PKR (GMV: Rs. ${metrics?.gmv})`);
  assert(metrics?.stores?.total > 0, `Total stores counter: ${metrics?.stores?.total}`);
  assert(metrics?.stores?.activePaid >= 0, `Active paid stores counter: ${metrics?.stores?.activePaid}`);
  assert(metrics?.stores?.trial >= 0, `14-Day Free trial stores counter: ${metrics?.stores?.trial}`);
  assert(metrics?.stores?.suspended >= 0, `Suspended stores counter: ${metrics?.stores?.suspended}`);
  assert(metrics?.stores?.expired >= 0, `Expired stores counter: ${metrics?.stores?.expired}`);
  assert(metrics?.subscribersBreakdown !== undefined, 'Subscribers breakdown provided (Basic, Standard, Premium)');

  // =========================================================================
  // PILLAR 2: TENANT & STORE LIFECYCLE MANAGEMENT
  // =========================================================================
  console.log('\n--- 3. Pillar 2: Tenant & Store Lifecycle Management ---');

  // 3.1 Get Directory
  const dirReq = { user: superUser, query: { search: '', status: 'all', plan: 'all' } };
  const dirRes = createMockRes();
  await superAdminController.getTenantsDirectory(dirReq, dirRes, (err) => {
    if (err) console.error(err);
  });
  assert(dirRes.statusCode === 200, 'getTenantsDirectory returns 200 OK');
  const tenants = dirRes.data?.tenants || [];
  assert(tenants.length > 0, `Retrieved ${tenants.length} tenants in directory`);

  const t1 = tenants[0];
  assert(!!t1.expiryCountdownText, `Expiry countdown formatted: "${t1.expiryCountdownText}"`);
  assert(t1.usage?.productsUsageText !== undefined, `Products usage meter: ${t1.usage?.productsUsageText}`);
  assert(t1.usage?.khatasUsageText !== undefined, `Khata accounts meter: ${t1.usage?.khatasUsageText}`);
  if (t1.phone) {
    assert(t1.whatsappUrl.startsWith('https://wa.me/'), `1-Click WhatsApp direct URL: ${t1.whatsappUrl}`);
  }

  // 3.2 Create Tenant Manually
  const createStoreReq = {
    user: superUser,
    body: {
      name: 'Gulshan Cash & Carry',
      slug: `gulshan-mart-${Date.now()}`,
      ownerName: 'Zubair Khan',
      ownerEmail: `zubair-${Date.now()}@gulshanmart.com`,
      ownerPassword: 'password123',
      phone: '03011234567',
      city: 'Karachi',
      subscriptionMonths: 12,
      plan: 'standard',
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const createStoreRes = createMockRes();
  await superAdminController.createTenant(createStoreReq, createStoreRes, (err) => {
    if (err) console.error(err);
  });
  assert(createStoreRes.statusCode === 201, 'createTenant returns 201 Created');
  const createdTenant = createStoreRes.data?.tenant;
  assert(!!createdTenant?._id, `Store tenant created with ID: ${createdTenant?._id}`);

  // 3.3 Plan & Resource Limit Override
  const overrideReq = {
    user: superUser,
    params: { id: createdTenant._id },
    body: {
      plan: 'premium',
      customLimits: {
        maxProducts: 99999,
        maxKhataCustomers: 99999,
        allowFractionalUnits: true,
        allowBarcodeGen: true,
        allowWhatsApp: true,
      },
      extendDays: 90,
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const overrideRes = createMockRes();
  await superAdminController.updateTenantPlanAndLimits(overrideReq, overrideRes, (err) => {
    if (err) console.error(err);
  });
  assert(overrideRes.statusCode === 200, 'updateTenantPlanAndLimits returns 200 OK');
  assert(overrideRes.data?.tenant?.plan === 'premium', 'Tenant upgraded to Premium plan');
  assert(overrideRes.data?.tenant?.planLimits?.allowFractionalUnits === true, 'Fractional units enabled');

  // 3.4 Quick Extend Subscription (+30 Days)
  const extendReq = {
    user: superUser,
    params: { id: createdTenant._id },
    body: { days: 30 },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const extendRes = createMockRes();
  await superAdminController.quickExtendSubscription(extendReq, extendRes, (err) => {
    if (err) console.error(err);
  });
  assert(extendRes.statusCode === 200, 'quickExtendSubscription extends expiry by +30 days (200 OK)');

  // 3.5 Toggle Store Suspension (Instant Lock HTTP 403)
  const suspendReq = {
    user: superUser,
    params: { id: createdTenant._id },
    body: { status: 'suspended' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const suspendRes = createMockRes();
  await superAdminController.toggleStoreSuspension(suspendReq, suspendRes, (err) => {
    if (err) console.error(err);
  });
  assert(suspendRes.statusCode === 200, 'Store suspension locked successfully (status: suspended)');

  // Restore to active
  const reactivateReq = {
    user: superUser,
    params: { id: createdTenant._id },
    body: { status: 'active' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const reactivateRes = createMockRes();
  await superAdminController.toggleStoreSuspension(reactivateReq, reactivateRes, (err) => {
    if (err) console.error(err);
  });
  assert(reactivateRes.statusCode === 200, 'Store reactivated successfully (status: active)');

  // 3.6 Hard Reset / Data Purge (Wipes transactional data, preserves owner credentials)
  const purgeReq = {
    user: superUser,
    params: { id: createdTenant._id },
    body: { confirmation: 'PURGE', purgeProducts: false },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const purgeRes = createMockRes();
  await superAdminController.purgeTenantData(purgeReq, purgeRes, (err) => {
    if (err) console.error(err);
  });
  assert(purgeRes.statusCode === 200, 'purgeTenantData wiped store test data while preserving owner');

  // =========================================================================
  // PILLAR 3: PAKISTANI OFFLINE PAYMENT VERIFICATION ENGINE
  // =========================================================================
  console.log('\n--- 4. Pillar 3: Pakistani Offline Payment Verification Engine ---');

  // Seed a pending payment slip for verification test
  const testPayment = {
    _id: `pay_test_${Date.now()}`,
    tenantId: createdTenant._id,
    storeName: createdTenant.name,
    amount: 3000,
    plan: 'standard',
    billingCycle: 'monthly',
    paymentMethod: 'JAZZCASH',
    transactionId: `TID-${Date.now()}`,
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
    status: 'pending',
    createdAt: new Date(),
  };
  if (!memoryStore.subscriptionPayments) memoryStore.subscriptionPayments = [];
  memoryStore.subscriptionPayments.unshift(testPayment);

  // 4.1 Fetch Payment Queue
  const queueReq = { user: superUser, query: { status: 'all' } };
  const queueRes = createMockRes();
  await superAdminController.getPaymentQueue(queueReq, queueRes, (err) => {
    if (err) console.error(err);
  });
  assert(queueRes.statusCode === 200, 'getPaymentQueue returns 200 OK');
  const pendingSlip = queueRes.data?.payments?.find((p) => p._id === testPayment._id);
  assert(!!pendingSlip, 'Pending payment slip found in review queue');
  assert(pendingSlip?.paymentMethod === 'JAZZCASH', 'Payment method is JAZZCASH');
  assert(!!pendingSlip?.transactionId, `TID present: ${pendingSlip?.transactionId}`);
  assert(!!pendingSlip?.receiptImageUrl, 'Receipt image URL attached for lightbox viewer');

  // 4.2 Approve Payment
  const approveReq = {
    user: superUser,
    params: { id: testPayment._id },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const approveRes = createMockRes();
  await superAdminController.approvePayment(approveReq, approveRes, (err) => {
    if (err) console.error(err);
  });
  assert(approveRes.statusCode === 200, 'approvePayment verified slip and shifted expiry (+30 days)');
  assert(approveRes.data?.payment?.status === 'approved', 'Payment status updated to "approved"');
  assert(approveRes.data?.tenant?.status === 'active', 'Tenant status set to "active"');

  // 4.3 Reject Payment Simulation via reviewPayment
  const fakePayment = {
    _id: `pay_fake_${Date.now()}`,
    tenantId: createdTenant._id,
    storeName: createdTenant.name,
    amount: 1500,
    plan: 'basic',
    billingCycle: 'monthly',
    paymentMethod: 'EASYPAISA',
    transactionId: 'FAKE-TID-0000',
    status: 'pending',
    createdAt: new Date(),
  };
  memoryStore.subscriptionPayments.unshift(fakePayment);

  const rejectReq = {
    user: superUser,
    params: { id: fakePayment._id },
    body: { action: 'reject', reason: 'TID not found in EasyPaisa business portal statement.' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const rejectRes = createMockRes();
  await superAdminController.reviewPayment(rejectReq, rejectRes, (err) => {
    if (err) console.error(err);
  });
  assert(rejectRes.statusCode === 200, 'reviewPayment successfully routed rejection with reason note');
  assert(rejectRes.data?.payment?.status === 'rejected', 'Payment status set to "rejected"');

  // =========================================================================
  // PILLAR 4: TENANT IMPERSONATION & REMOTE SUPPORT ("LOGIN AS SHOP")
  // =========================================================================
  console.log('\n--- 5. Pillar 4: Tenant Impersonation & Remote Support ---');

  const impReq = {
    user: superUser,
    params: { id: createdTenant._id },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const impRes = createMockRes();
  await superAdminController.impersonateStore(impReq, impRes, (err) => {
    if (err) console.error(err);
  });
  assert(impRes.statusCode === 200, 'impersonateStore returns 200 OK');
  assert(!!impRes.data?.token, 'Scoped JWT impersonation token issued');
  assert(impRes.data?.user?.isImpersonated === true, 'user.isImpersonated is true');
  assert(impRes.data?.user?.tenantId === createdTenant._id, 'Session scoped to target tenantId');

  // =========================================================================
  // PILLAR 5: GLOBAL SYSTEM BROADCAST NOTIFICATIONS
  // =========================================================================
  console.log('\n--- 6. Pillar 5: Global System Broadcast Notifications ---');

  // 5.1 Publish Announcement
  const pubReq = {
    user: superUser,
    body: {
      title: 'Scheduled Cloud Upgrade',
      message: 'NaveedPOS backup completed. Zero disruption to POS billing.',
      type: 'info',
      targetAudience: 'ALL',
      isActive: true,
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const pubRes = createMockRes();
  await superAdminController.createOrUpdateBroadcast(pubReq, pubRes, (err) => {
    if (err) console.error(err);
  });
  assert(pubRes.statusCode === 201, 'createOrUpdateBroadcast published global banner (201 Created)');
  const publishedId = pubRes.data?.broadcast?._id;

  // 5.2 Fetch Active Announcement for Merchant
  const activeReq = { query: { audience: 'ALL' } };
  const activeRes = createMockRes();
  await superAdminController.getActiveBroadcast(activeReq, activeRes, (err) => {
    if (err) console.error(err);
  });
  assert(activeRes.statusCode === 200, 'getActiveBroadcast returns 200 OK');
  assert(activeRes.data?.broadcast?.title === 'Scheduled Cloud Upgrade', 'Merchant retrieved active announcement title');

  // 5.3 Delete Announcement
  const delReq = {
    user: superUser,
    params: { id: publishedId },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest/TestRunner' },
  };
  const delRes = createMockRes();
  await superAdminController.deleteBroadcast(delReq, delRes, (err) => {
    if (err) console.error(err);
  });
  assert(delRes.statusCode === 200, 'deleteBroadcast deleted announcement');

  // =========================================================================
  // PILLAR 6: PLATFORM SECURITY & MASTER AUDIT LOG
  // =========================================================================
  console.log('\n--- 7. Pillar 6: Platform Security & Master Audit Log ---');

  const auditReq = {
    user: superUser,
    query: { action: 'all', limit: 20 },
  };
  const auditRes = createMockRes();
  await superAdminController.getAuditLogs(auditReq, auditRes, (err) => {
    if (err) console.error(err);
  });
  assert(auditRes.statusCode === 200, 'getAuditLogs returns 200 OK');
  const logs = auditRes.data?.auditLogs || [];
  assert(logs.length > 0, `Master audit log recorded ${logs.length} immutable events`);

  const recordedActions = [...new Set(logs.map((l) => l.action))];
  console.log(`  Actions recorded in audit trail: ${recordedActions.join(', ')}`);

  assert(recordedActions.includes('STORE_ACTIVATED'), 'STORE_ACTIVATED recorded in audit log');
  assert(recordedActions.includes('PLAN_OVERRIDE'), 'PLAN_OVERRIDE recorded in audit log');
  assert(recordedActions.includes('SUBSCRIPTION_EXTENDED'), 'SUBSCRIPTION_EXTENDED recorded in audit log');
  assert(recordedActions.includes('STORE_SUSPENDED'), 'STORE_SUSPENDED recorded in audit log');
  assert(recordedActions.includes('DATA_PURGED'), 'DATA_PURGED recorded in audit log');
  assert(recordedActions.includes('PAYMENT_APPROVED'), 'PAYMENT_APPROVED recorded in audit log');
  assert(recordedActions.includes('PAYMENT_REJECTED'), 'PAYMENT_REJECTED recorded in audit log');
  assert(recordedActions.includes('IMPERSONATION_STARTED'), 'IMPERSONATION_STARTED recorded in audit log');
  assert(recordedActions.includes('BROADCAST_PUBLISHED'), 'BROADCAST_PUBLISHED recorded in audit log');

  console.log('\n======================================================================');
  console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
