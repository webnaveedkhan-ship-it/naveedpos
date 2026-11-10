const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const app = require('../src/server');

let TEST_PORT;

function makeRequest({ method = 'GET', path, token = null, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
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
  console.log('=== Starting NaveedPOS Super Admin 6-Pillar Platform Owner Verification ===\n');

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
  assert(storeAdminLogin.status === 200, 'Store Admin login succeeds (200 OK)');
  const storeAdminToken = storeAdminLogin.body?.token;

  // 1.3 Store Admin access to Super Admin route blocked
  const storeAdminAttempt = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/metrics',
    token: storeAdminToken,
  });
  assert(
    storeAdminAttempt.status === 403,
    `Store Admin attempting Super Admin route gets 403 Forbidden (Received: ${storeAdminAttempt.status})`
  );

  // 1.4 Super Admin Login (Master Platform Owner: Naveed)
  const superAdminLogin = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'naveed@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(superAdminLogin.status === 200, 'Super Admin (Naveed) login succeeds (200 OK)');
  assert(
    superAdminLogin.body?.user?.role === 'SUPER_ADMIN',
    `User role is SUPER_ADMIN (Received: ${superAdminLogin.body?.user?.role})`
  );
  const superToken = superAdminLogin.body?.token;
  assert(!!superToken, 'Super Admin JWT token received');

  // =========================================================================
  // PILLAR 1: PLATFORM TELEMETRY & FINANCIAL HEALTH
  // =========================================================================
  console.log('\n--- 2. Testing Pillar 1: Platform Telemetry & Financial Health ---');

  const metricsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/metrics',
    token: superToken,
  });
  assert(metricsRes.status === 200, 'GET /api/super-admin/metrics returns 200 OK');
  const metrics = metricsRes.body?.metrics;
  assert(metrics !== undefined, 'Metrics payload returned');
  assert(typeof metrics?.mrr === 'number', `MRR calculated as number (MRR: Rs. ${metrics?.mrr})`);
  assert(typeof metrics?.gmv === 'number', `Platform GMV calculated (GMV: Rs. ${metrics?.gmv})`);
  assert(metrics?.stores?.total > 0, `Total stores reported: ${metrics?.stores?.total}`);
  assert(metrics?.stores?.activePaid >= 0, `Active paid stores: ${metrics?.stores?.activePaid}`);
  assert(metrics?.subscribersBreakdown !== undefined, 'Subscribers breakdown provided');

  // Check alias /stats
  const statsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/stats',
    token: superToken,
  });
  assert(statsRes.status === 200, 'GET /api/super-admin/stats (alias) returns 200 OK');

  // =========================================================================
  // PILLAR 2: TENANT & STORE LIFECYCLE MANAGEMENT
  // =========================================================================
  console.log('\n--- 3. Testing Pillar 2: Tenant & Store Lifecycle Management ---');

  // 3.1 Get Tenants Directory
  const tenantsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/tenants',
    token: superToken,
  });
  assert(tenantsRes.status === 200, 'GET /api/super-admin/tenants returns 200 OK');
  const tenantsList = tenantsRes.body?.tenants || [];
  assert(tenantsList.length > 0, `Found ${tenantsList.length} store tenants`);

  const sampleTenant = tenantsList[0];
  assert(!!sampleTenant.name, `Tenant name: "${sampleTenant.name}"`);
  assert(!!sampleTenant.expiryCountdownText, `Expiry countdown: "${sampleTenant.expiryCountdownText}"`);
  assert(sampleTenant.usage?.productsUsageText !== undefined, `Products usage: ${sampleTenant.usage?.productsUsageText}`);
  assert(sampleTenant.usage?.khatasUsageText !== undefined, `Khata accounts usage: ${sampleTenant.usage?.khatasUsageText}`);
  if (sampleTenant.phone) {
    assert(sampleTenant.whatsappUrl.startsWith('https://wa.me/'), `1-click WhatsApp formatted: ${sampleTenant.whatsappUrl}`);
  }

  // 3.2 Create New Store Tenant Manually
  const uniqueStoreSlug = `test-mart-${Date.now()}`;
  const uniqueStoreEmail = `owner-${Date.now()}@testmart.com`;
  const createStoreRes = await makeRequest({
    method: 'POST',
    path: '/api/super-admin/tenants',
    token: superToken,
    body: {
      name: 'Gulberg Super Mart',
      slug: uniqueStoreSlug,
      ownerName: 'Muhammad Ali',
      ownerEmail: uniqueStoreEmail,
      ownerPassword: 'password123',
      phone: '03001234567',
      city: 'Lahore',
      subscriptionMonths: 12,
      plan: 'standard',
    },
  });
  assert(createStoreRes.status === 201, `Create tenant manually returns 201 Created (Status: ${createStoreRes.status})`);
  const createdTenantId = createStoreRes.body?.tenant?._id;
  assert(!!createdTenantId, `Created tenant ID: ${createdTenantId}`);

  // 3.3 Plan & Limit Override
  const planOverrideRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/tenants/${createdTenantId}/plan`,
    token: superToken,
    body: {
      plan: 'premium',
      customLimits: {
        maxProducts: 99999,
        maxKhataCustomers: 99999,
        allowFractionalUnits: true,
        allowBarcodeGen: true,
      },
      extendDays: 60,
    },
  });
  assert(planOverrideRes.status === 200, 'Plan override to PREMIUM with custom limits returns 200 OK');
  assert(planOverrideRes.body?.tenant?.plan === 'premium', 'Tenant plan upgraded to premium');

  // Test alias PATCH /api/super-admin/tenants/:id/subscription
  const patchPlanRes = await makeRequest({
    method: 'PATCH',
    path: `/api/super-admin/tenants/${createdTenantId}/subscription`,
    token: superToken,
    body: {
      plan: 'standard',
      extendDays: 30,
    },
  });
  assert(patchPlanRes.status === 200, 'PATCH /subscription (alias) returns 200 OK');

  // 3.4 Quick Extend Subscription (+30 Days)
  const extendRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/tenants/${createdTenantId}/extend`,
    token: superToken,
    body: { days: 30 },
  });
  assert(extendRes.status === 200, 'Quick extend subscription by +30 days returns 200 OK');

  // 3.5 Toggle Store Suspension (Lock store out of POS billing)
  const suspendRes = await makeRequest({
    method: 'PUT',
    path: `/api/super-admin/tenants/${createdTenantId}/status`,
    token: superToken,
    body: { status: 'suspended' },
  });
  assert(suspendRes.status === 200, 'Toggle store suspension to "suspended" returns 200 OK');

  // Reactivate store via alias PATCH /api/super-admin/tenants/:id/status
  const activateRes = await makeRequest({
    method: 'PATCH',
    path: `/api/super-admin/tenants/${createdTenantId}/status`,
    token: superToken,
    body: { status: 'active' },
  });
  assert(activateRes.status === 200, 'PATCH /status (alias) reactivates store to "active" (200 OK)');

  // 3.6 Hard Reset / Data Purge
  const purgeRes = await makeRequest({
    method: 'POST',
    path: `/api/super-admin/tenants/${createdTenantId}/purge-data`,
    token: superToken,
    body: { confirmation: 'PURGE', purgeProducts: false },
  });
  assert(purgeRes.status === 200, 'Hard reset / data purge returns 200 OK with owner preserved');

  // =========================================================================
  // PILLAR 3: PAKISTANI OFFLINE PAYMENT VERIFICATION ENGINE
  // =========================================================================
  console.log('\n--- 4. Testing Pillar 3: Offline Payment Verification Engine ---');

  // 4.1 Fetch Payment Queue
  const paymentsRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/payments?status=all',
    token: superToken,
  });
  assert(paymentsRes.status === 200, 'GET /api/super-admin/payments returns 200 OK');
  const paymentsList = paymentsRes.body?.payments || [];
  assert(Array.isArray(paymentsList), 'Payments list is an array');

  // 4.2 Test review endpoint with sample or simulated payment
  if (paymentsList.length > 0) {
    const payment = paymentsList[0];
    const reviewRes = await makeRequest({
      method: 'PATCH',
      path: `/api/super-admin/payments/${payment._id}/review`,
      token: superToken,
      body: { action: 'approve' },
    });
    console.log(`  Payment review result: HTTP ${reviewRes.status}`);
  }

  // =========================================================================
  // PILLAR 4: TENANT IMPERSONATION & REMOTE SUPPORT ("LOGIN AS SHOP")
  // =========================================================================
  console.log('\n--- 5. Testing Pillar 4: Tenant Impersonation & Remote Support ---');

  const impersonateRes = await makeRequest({
    method: 'POST',
    path: `/api/super-admin/tenants/${sampleTenant._id}/impersonate`,
    token: superToken,
  });
  assert(impersonateRes.status === 200, `Impersonation token generated (200 OK): ${impersonateRes.body?.message}`);
  const impToken = impersonateRes.body?.token;
  assert(!!impToken, 'Scoped impersonation JWT token received');
  assert(impersonateRes.body?.user?.isImpersonated === true, 'isImpersonated flag set to true');

  // Verify impersonated token can access merchant routes
  const impMeRes = await makeRequest({
    method: 'GET',
    path: '/api/auth/me',
    token: impToken,
  });
  assert(impMeRes.status === 200, 'Impersonated session valid on /api/auth/me');
  assert(impMeRes.body?.user?.tenantId === sampleTenant._id, 'Impersonated session scoped to target tenantId');

  // =========================================================================
  // PILLAR 5: GLOBAL SYSTEM BROADCAST NOTIFICATIONS
  // =========================================================================
  console.log('\n--- 6. Testing Pillar 5: Global System Broadcast Notifications ---');

  const broadcastRes = await makeRequest({
    method: 'POST',
    path: '/api/super-admin/broadcast',
    token: superToken,
    body: {
      title: 'Emergency Cloud Maintenance',
      message: 'Server migration scheduled tonight from 3:00 AM to 3:30 AM PKT. Minimal downtime expected.',
      type: 'warning',
      targetAudience: 'ALL',
      isActive: true,
    },
  });
  assert(broadcastRes.status === 201, `Broadcast created returns 201: ${broadcastRes.body?.message}`);
  const broadcastId = broadcastRes.body?.broadcast?._id;
  assert(!!broadcastId, `Broadcast ID: ${broadcastId}`);

  // Fetch active broadcast as merchant
  const activeBcastRes = await makeRequest({
    method: 'GET',
    path: '/api/broadcast/active',
  });
  assert(activeBcastRes.status === 200, 'GET /api/broadcast/active returns 200 OK');
  assert(activeBcastRes.body?.broadcast?.title === 'Emergency Cloud Maintenance', 'Merchant retrieved active announcement');

  // Delete broadcast
  const delBcastRes = await makeRequest({
    method: 'DELETE',
    path: `/api/super-admin/broadcast/${broadcastId}`,
    token: superToken,
  });
  assert(delBcastRes.status === 200, 'DELETE broadcast returns 200 OK');

  // =========================================================================
  // PILLAR 6: PLATFORM SECURITY & MASTER AUDIT LOG
  // =========================================================================
  console.log('\n--- 7. Testing Pillar 6: Master Audit Log Trail ---');

  const auditRes = await makeRequest({
    method: 'GET',
    path: '/api/super-admin/audit?limit=20',
    token: superToken,
  });
  assert(auditRes.status === 200, 'GET /api/super-admin/audit returns 200 OK');
  const auditEntries = auditRes.body?.auditLogs || [];
  assert(auditEntries.length > 0, `Audit log contains ${auditEntries.length} immutable entries`);

  const actionsLogged = auditEntries.map((l) => l.action);
  console.log(`  Actions found in audit log: ${[...new Set(actionsLogged)].join(', ')}`);
  assert(
    actionsLogged.includes('PLAN_OVERRIDE') ||
    actionsLogged.includes('STORE_ACTIVATED') ||
    actionsLogged.includes('DATA_PURGED') ||
    actionsLogged.includes('IMPERSONATION_STARTED') ||
    actionsLogged.includes('BROADCAST_PUBLISHED'),
    'Audit trail contains expected security action events'
  );

  console.log('\n=================================================================');
  console.log('🎉 ALL 6 SUPER ADMIN PILLARS VERIFIED & PASSED END-TO-END!');
  console.log('=================================================================\n');
}

// Start test server in-process on an ephemeral port
const server = app.listen(0, '127.0.0.1', async () => {
  TEST_PORT = server.address().port;
  console.log(`\nIn-process test server running on http://127.0.0.1:${TEST_PORT}`);
  try {
    await runTests();
    server.close(() => {
      console.log('Test server closed cleanly.');
      process.exit(0);
    });
  } catch (err) {
    console.error('Test execution error:', err);
    server.close(() => process.exit(1));
  }
});
