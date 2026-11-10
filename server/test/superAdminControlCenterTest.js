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
  console.log('=== Starting NaveedPOS Super Admin Control Center End-to-End Verification ===\n');

  // =========================================================================
  // 1. SECURITY & ACCESS BOUNDARIES (RBAC)
  // =========================================================================
  console.log('--- 1. Testing Security & Access Boundaries ---');

  // 1.1 Unauthenticated Request
  const unauthRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/metrics',
  });
  assert(
    unauthRes.status === 401,
    `Unauthenticated GET /api/super-admin/metrics returns 401 Unauthorized (Received: ${unauthRes.status})`
  );

  // 1.2 Store Admin Login (Non-Super Admin)
  const storeAdminLogin = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'admin@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(storeAdminLogin.status === 200, 'Store Admin login returns 200');
  const storeAdminToken = storeAdminLogin.body.token;
  assert(!!storeAdminToken, 'Store Admin received valid JWT');

  // 1.3 Store Admin Rejection (403 Forbidden) on Super Admin Endpoints
  const forbiddenMetricsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/metrics',
    token: storeAdminToken,
  });
  assert(
    forbiddenMetricsRes.status === 403,
    `Store Admin accessing /api/super-admin/metrics is rejected with 403 Forbidden (Received: ${forbiddenMetricsRes.status})`
  );

  const forbiddenTenantsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/tenants',
    token: storeAdminToken,
  });
  assert(
    forbiddenTenantsRes.status === 403,
    `Store Admin accessing /api/super-admin/tenants is rejected with 403 Forbidden (Received: ${forbiddenTenantsRes.status})`
  );

  const forbiddenBroadcastRes = await makeRequest({
    method: 'POST',
    path: '/api/super-admin/broadcast',
    token: storeAdminToken,
    body: { title: 'Hack', message: 'Not allowed' },
  });
  assert(
    forbiddenBroadcastRes.status === 403,
    `Store Admin attempting POST /api/super-admin/broadcast is rejected with 403 Forbidden (Received: ${forbiddenBroadcastRes.status})`
  );

  // =========================================================================
  // 2. SUPER ADMIN AUTHENTICATION
  // =========================================================================
  console.log('\n--- 2. Authenticating Platform Super Admin (Naveed) ---');

  const superAdminLogin = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'naveed@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(superAdminLogin.status === 200, 'Super Admin login returns 200 OK');
  assert(superAdminLogin.body.user?.role === 'SUPER_ADMIN', 'Super Admin user has role SUPER_ADMIN');
  assert(superAdminLogin.body.user?.tenantId === null, 'Super Admin user has tenantId null');
  const superAdminToken = superAdminLogin.body.token;
  assert(!!superAdminToken, 'Super Admin received valid JWT token');

  // =========================================================================
  // 3. GLOBAL SAAS METRICS & FINANCIAL HEALTH
  // =========================================================================
  console.log('\n--- 3. Testing Global SaaS Metrics & Financial Health ---');

  const metricsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/metrics',
    token: superAdminToken,
  });
  assert(metricsRes.status === 200, 'GET /api/super-admin/metrics returns 200');
  const metrics = metricsRes.body.metrics;
  assert(typeof metrics?.mrr === 'number', `Calculated MRR is numeric: ${metrics?.mrr}`);
  assert(metrics?.mrrFormatted?.includes('Rs.'), `MRR is formatted in PKR: ${metrics?.mrrFormatted}`);
  assert(metrics?.stores?.total > 0, `Total stores counted: ${metrics?.stores?.total}`);
  assert(typeof metrics?.stores?.activePaid === 'number', `Active paid stores count available: ${metrics?.stores?.activePaid}`);
  assert(typeof metrics?.stores?.trial === 'number', `Trial stores count available: ${metrics?.stores?.trial}`);
  assert(typeof metrics?.gmv === 'number', `GMV aggregate volume calculated: ${metrics?.gmvFormatted}`);
  assert(typeof metrics?.pendingPaymentsCount === 'number', `Pending payment approvals badge: ${metrics?.pendingPaymentsCount}`);

  // =========================================================================
  // 4. TENANT MANAGEMENT DIRECTORY & ACTIONS
  // =========================================================================
  console.log('\n--- 4. Testing Tenant Management Directory & Actions ---');

  // 4.1 Get Full Tenants Directory
  const tenantsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/tenants',
    token: superAdminToken,
  });
  assert(tenantsRes.status === 200, 'GET /api/super-admin/tenants returns 200');
  const tenants = tenantsRes.body.tenants;
  assert(Array.isArray(tenants) && tenants.length > 0, `Returned ${tenants.length} registered stores`);

  const firstTenant = tenants[0];
  assert(!!firstTenant.name, `Tenant name present: "${firstTenant.name}"`);
  assert(!!firstTenant.slug, `Tenant slug present: "${firstTenant.slug}"`);
  assert(!!firstTenant.expiryCountdownText, `Expiry countdown text present: "${firstTenant.expiryCountdownText}"`);
  assert(!!firstTenant.usage?.productsUsageText, `Catalog products usage present: "${firstTenant.usage?.productsUsageText}"`);
  assert(!!firstTenant.usage?.khatasUsageText, `Khata accounts usage present: "${firstTenant.usage?.khatasUsageText}"`);

  // 4.2 Search Filtering
  const searchRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/tenants?search=Lahore',
    token: superAdminToken,
  });
  assert(searchRes.status === 200, 'Tenant search with query "Lahore" returns 200');
  assert(
    searchRes.body.tenants.some((t) => t.name.includes('Lahore') || t.city === 'Lahore'),
    'Search results match Lahore query'
  );

  // 4.3 Quick Extend Expiry (+14 Days)
  const extendRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/tenants/${firstTenant._id}/extend`,
    token: superAdminToken,
    body: { days: 14 },
  });
  assert(extendRes.status === 200, `Quick extend +14 days returns 200: ${extendRes.body.message}`);

  // 4.4 Change Plan Tier & Override Limits
  const planUpdateRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/tenants/${firstTenant._id}/plan`,
    token: superAdminToken,
    body: {
      plan: 'premium',
      customLimits: {
        maxProducts: 5000,
        allowBarcodeGen: true,
        allowWhatsApp: true,
      },
      extendDays: 30,
    },
  });
  assert(planUpdateRes.status === 200, `Change plan to Premium returns 200: ${planUpdateRes.body.message}`);
  assert(planUpdateRes.body.tenant.plan === 'premium', 'Tenant plan successfully updated to premium');

  // 4.5 Status Toggle (Activate / Suspend)
  const suspendRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/tenants/${firstTenant._id}/status`,
    token: superAdminToken,
    body: { status: 'suspended' },
  });
  assert(suspendRes.status === 200, `Store suspension returns 200: ${suspendRes.body.message}`);
  assert(suspendRes.body.tenant.status === 'suspended', 'Store status updated to suspended');

  // Reactivate
  const reactivateRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/tenants/${firstTenant._id}/status`,
    token: superAdminToken,
    body: { status: 'active' },
  });
  assert(reactivateRes.status === 200, 'Store reactivation returns 200');
  assert(reactivateRes.body.tenant.status === 'active', 'Store status updated to active');

  // 4.6 Store Impersonation ("Login as Shop")
  const impersonateRes = await makeRequest({
    method: 'POST',
    path: `/api/super-admin/tenants/${firstTenant._id}/impersonate`,
    token: superAdminToken,
  });
  assert(impersonateRes.status === 200, `Store impersonation returns 200: ${impersonateRes.body.message}`);
  assert(!!impersonateRes.body.token, 'Scoped temporary impersonation token generated');
  assert(impersonateRes.body.user.isImpersonated === true, 'Impersonated session flag is true');
  assert(impersonateRes.body.user.tenantId === firstTenant._id, 'Impersonated session scoped to target tenant');

  // =========================================================================
  // 5. SUBSCRIPTION PAYMENT APPROVAL QUEUE
  // =========================================================================
  console.log('\n--- 5. Testing Subscription Payment Approval Queue ---');

  // 5.1 Store Admin submits payment slip
  const submitSlipRes = await makeRequest({
    method: 'POST',
    path: '/api/tenants/billing/payment',
    token: storeAdminToken,
    body: {
      plan: 'standard',
      billingCycle: 'monthly',
      amount: 3000,
      paymentMethod: 'JazzCash',
      transactionId: `JC-${Date.now()}`,
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
    },
  });
  assert(submitSlipRes.status === 201, 'Store Admin successfully submits payment slip (returns 201)');
  const submittedPaymentId = submitSlipRes.body.payment._id;

  // 5.2 Super Admin retrieves payment queue
  const queueRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/payments?status=pending',
    token: superAdminToken,
  });
  assert(queueRes.status === 200, 'GET /api/super-admin/payments returns 200');
  const pendingPayment = queueRes.body.payments.find((p) => p._id === submittedPaymentId);
  assert(!!pendingPayment, 'Newly submitted payment slip found in pending approval queue');
  assert(pendingPayment.paymentMethod === 'JazzCash', 'Payment channel is JazzCash');
  assert(pendingPayment.amount === 3000, 'Payment amount is Rs. 3,000');

  // 5.3 Super Admin approves payment
  const approveRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/payments/${submittedPaymentId}/approve`,
    token: superAdminToken,
  });
  assert(approveRes.status === 200, `Approve payment returns 200: ${approveRes.body.message}`);
  assert(approveRes.body.payment.status === 'approved', 'Payment status updated to approved');
  assert(approveRes.body.tenant.status === 'active', 'Tenant status reactivated to active');

  // 5.4 Test Rejection flow with another payment
  const submitSlip2Res = await makeRequest({
    method: 'POST',
    path: '/api/tenants/billing/payment',
    token: storeAdminToken,
    body: {
      plan: 'basic',
      billingCycle: 'monthly',
      amount: 1500,
      paymentMethod: 'EasyPaisa',
      transactionId: `EP-FAKE-${Date.now()}`,
    },
  });
  assert(submitSlip2Res.status === 201, 'Submitted second payment slip');
  const fakePaymentId = submitSlip2Res.body.payment._id;

  const rejectRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/payments/${fakePaymentId}/reject`,
    token: superAdminToken,
    body: { reason: 'Transaction ID not found in bank ledger.' },
  });
  assert(rejectRes.status === 200, `Reject payment returns 200: ${rejectRes.body.message}`);
  assert(rejectRes.body.payment.status === 'rejected', 'Payment status updated to rejected');
  assert(rejectRes.body.payment.rejectionReason.includes('not found'), 'Rejection note saved');

  // =========================================================================
  // 6. GLOBAL SYSTEM BROADCAST NOTIFICATIONS
  // =========================================================================
  console.log('\n--- 6. Testing Global System Broadcast Notifications ---');

  // 6.1 Create Broadcast Announcement
  const testTitle = `Scheduled Cloud Upgrade Notice (${Date.now()})`;
  const createBroadcastRes = await makeRequest({
    method: 'POST',
    path: '/api/super-admin/broadcast',
    token: superAdminToken,
    body: {
      title: testTitle,
      message: 'All POS terminals will automatically synchronize with cloud backup servers at 2 AM PKT.',
      type: 'warning',
      isActive: true,
    },
  });
  assert(createBroadcastRes.status === 201, `Create broadcast returns 201: ${createBroadcastRes.body.message}`);
  assert(createBroadcastRes.body.broadcast.isActive === true, 'Broadcast is active');
  const broadcastId = createBroadcastRes.body.broadcast._id;

  // 6.2 Merchant Active Broadcast retrieval
  const activeBroadcastRes = await makeRequest({
    method: 'GET',
    path: '/api/broadcast/active',
  });
  assert(activeBroadcastRes.status === 200, 'GET /api/broadcast/active returns 200');
  assert(
    activeBroadcastRes.body.broadcast?.title === testTitle,
    `Active broadcast delivered to merchants: "${activeBroadcastRes.body.broadcast?.title}"`
  );

  // 6.3 Super Admin lists all broadcasts
  const listBroadcastRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/broadcast',
    token: superAdminToken,
  });
  assert(listBroadcastRes.status === 200, 'GET /api/super-admin/broadcast returns 200');
  assert(listBroadcastRes.body.broadcasts.length > 0, 'Broadcast history contains items');

  // 6.4 Delete broadcast
  const deleteBroadcastRes = await makeRequest({
    method: 'DELETE',
    path: `/api/super-admin/broadcast/${broadcastId}`,
    token: superAdminToken,
  });
  assert(deleteBroadcastRes.status === 200, 'Delete broadcast returns 200');

  console.log('\n=================================================================');
  console.log('🎉 ALL SUPER ADMIN CONTROL CENTER TESTS PASSED PERFECTLY (100%)!');
  console.log('=================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
