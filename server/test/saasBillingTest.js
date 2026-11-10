/**
 * Integration Test for NaveedPOS SaaS Onboarding, Billing & Super Admin Flow
 */
const bcrypt = require('bcryptjs');
const memoryStore = require('../src/config/memoryStore');
const authController = require('../src/controllers/authController');
const tenantController = require('../src/controllers/tenantController');

// Ensure memory store mode
global.useMemoryStore = true;

const runTests = async () => {
  console.log('=== Starting NaveedPOS SaaS Lifecycle Integration Tests ===\n');
  await memoryStore.init();
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  };

  // Helper mock for req/res
  const createMockReqRes = (body = {}, user = null, params = {}, query = {}) => {
    const req = { body, user, params, query };
    const res = {
      statusCode: 200,
      jsonData: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.jsonData = data;
        return this;
      },
      cookie: function () {
        return this;
      },
    };
    return { req, res };
  };

  // TEST 1: Public Self-Service Signup with 14-Day Free Trial
  console.log('1. Testing Public Self-Service Registration (/api/auth/register-trial)...');
  const signupReqRes = createMockReqRes({
    storeName: 'Gulberg Super Mart',
    ownerName: 'Rashid Khan',
    email: 'rashid@gulbergmart.pk',
    phone: '0321-9988776',
    city: 'Lahore',
    password: 'password123',
  });

  await authController.registerStoreAndTrial(signupReqRes.req, signupReqRes.res, (err) => {
    console.error('Next error:', err);
  });

  assert(signupReqRes.res.statusCode === 201, 'Response status is 201 Created');
  assert(signupReqRes.res.jsonData.success === true, 'Success flag is true');
  assert(!!signupReqRes.res.jsonData.token, 'JWT Token generated and returned');

  const registeredUser = signupReqRes.res.jsonData.user;
  const registeredTenant = signupReqRes.res.jsonData.tenant;
  assert(registeredUser.role === 'STORE_ADMIN', 'User created with STORE_ADMIN role');
  assert(registeredTenant.status === 'trial', 'Store tenant created in "trial" status');
  assert(registeredTenant.plan === 'trial', 'Store tenant plan is "trial"');
  assert(registeredTenant.city === 'Lahore', 'Store tenant city correctly saved');

  const daysLeft = Math.ceil((new Date(registeredTenant.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  assert(daysLeft >= 13 && daysLeft <= 14, `Store tenant has 14-day validity window (computed: ${daysLeft} days)`);

  // Verify starter products provisioned
  const storeProducts = memoryStore.products.filter((p) => p.tenantId === registeredTenant._id);
  assert(storeProducts.length >= 3, `Starter inventory products auto-seeded for trial store (${storeProducts.length} items)`);

  // TEST 2: Store Owner views own billing info (/api/tenants/billing)
  console.log('\n2. Testing Store Admin View Billing (/api/tenants/billing)...');
  const billingReqRes = createMockReqRes({}, registeredUser);
  await tenantController.getMyTenantBilling(billingReqRes.req, billingReqRes.res, (err) => console.error(err));

  assert(billingReqRes.res.statusCode === 200, 'Billing info returned with HTTP 200');
  assert(billingReqRes.res.jsonData.billing.status === 'trial', 'Billing status is trial');
  assert(billingReqRes.res.jsonData.billing.daysRemaining > 0, 'Days remaining calculated');

  // TEST 3: Store Owner submits payment verification proof (JazzCash)
  console.log('\n3. Testing Submit Payment Proof (/api/tenants/billing/payment)...');
  const payReqRes = createMockReqRes(
    {
      amount: 2500,
      billingCycle: 'monthly',
      paymentMethod: 'JAZZCASH',
      transactionId: 'JC-TID-9928174',
      receiptUrl: 'https://example.com/receipt.jpg',
    },
    registeredUser
  );

  await tenantController.submitSubscriptionPayment(payReqRes.req, payReqRes.res, (err) => console.error(err));
  assert(payReqRes.res.statusCode === 201, 'Payment verification submitted with HTTP 201');
  assert(payReqRes.res.jsonData.payment.status === 'pending', 'Payment status is "pending" review');
  assert(payReqRes.res.jsonData.payment.amount === 2500, 'Payment amount is 2500 PKR');

  const paymentRecord = payReqRes.res.jsonData.payment;

  // TEST 4: Super Admin views pending payments & platform metrics
  console.log('\n4. Testing Super Admin Control Plane (/api/tenants/payments & /metrics/platform)...');
  const superAdmin = memoryStore.users.find((u) => u.role === 'SUPER_ADMIN');
  assert(!!superAdmin, 'Super Admin user exists');

  const statsReqRes = createMockReqRes({}, superAdmin);
  await tenantController.getPlatformStats(statsReqRes.req, statsReqRes.res, (err) => console.error(err));
  assert(statsReqRes.res.statusCode === 200, 'Platform stats returned with HTTP 200');
  assert(statsReqRes.res.jsonData.stats.pendingPaymentsCount >= 1, 'Pending payments counter increments');
  assert(statsReqRes.res.jsonData.stats.trialTenants >= 1, 'Trial tenants counter correctly tracked');

  const paymentsReqRes = createMockReqRes({}, superAdmin, {}, { status: 'pending' });
  await tenantController.getSubscriptionPayments(paymentsReqRes.req, paymentsReqRes.res, (err) => console.error(err));
  assert(paymentsReqRes.res.statusCode === 200, 'Pending payments list returned');
  const foundPay = paymentsReqRes.res.jsonData.payments.find((p) => p.transactionId === 'JC-TID-9928174');
  assert(!!foundPay, 'Submitted payment found in Super Admin review queue');

  // TEST 5: Super Admin Approves Payment & Extends Store License
  console.log('\n5. Testing Super Admin Payment Approval (/api/tenants/payments/:id/approve)...');
  const approveReqRes = createMockReqRes({}, superAdmin, { id: paymentRecord._id });
  await tenantController.approveSubscriptionPayment(approveReqRes.req, approveReqRes.res, (err) => console.error(err));

  assert(approveReqRes.res.statusCode === 200, 'Payment approved with HTTP 200');
  assert(approveReqRes.res.jsonData.payment.status === 'approved', 'Payment status updated to "approved"');
  assert(approveReqRes.res.jsonData.tenant.status === 'active', 'Store tenant promoted to "active" status');
  assert(approveReqRes.res.jsonData.tenant.plan === 'monthly', 'Store tenant plan set to "monthly"');

  const extendedDays = Math.ceil(
    (new Date(approveReqRes.res.jsonData.tenant.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)
  );
  assert(extendedDays >= 40, `Store subscription validity advanced by 30 days (total: ${extendedDays} days)`);

  // TEST 6: Super Admin Impersonates Store (Support Access)
  console.log('\n6. Testing Super Admin Store Impersonation (/api/auth/impersonate/:tenantId)...');
  const impReqRes = createMockReqRes({}, superAdmin, { tenantId: registeredTenant._id });
  await authController.impersonateTenant(impReqRes.req, impReqRes.res, (err) => console.error(err));

  assert(impReqRes.res.statusCode === 200, 'Impersonation token minted with HTTP 200');
  assert(!!impReqRes.res.jsonData.token, 'Scoped token generated');
  assert(impReqRes.res.jsonData.user.tenantId === registeredTenant._id, 'Impersonated token scoped to target tenant');
  assert(impReqRes.res.jsonData.user.tenantName === registeredTenant.name, 'Target tenant name returned');

  console.log(`\n=== Integration Test Complete: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
};

runTests();
