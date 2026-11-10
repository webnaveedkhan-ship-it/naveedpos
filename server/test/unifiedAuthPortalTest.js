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
  console.log('=== Starting NaveedPOS Clean Two-Option Auth Portal Tests ===\n');

  // 1. Validation on Sign In
  console.log('1. Testing Sign In Validation & Error Handling (/api/auth/login)...');
  const emptyRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {},
  });
  assert(emptyRes.status === 400, `Missing credentials returns 400 Bad Request (Received: ${emptyRes.status})`);

  const badPassRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'admin@naveedpos.com', password: 'wrong_password_xyz' },
  });
  assert(badPassRes.status === 401, `Invalid password returns 401 Unauthorized (Received: ${badPassRes.status})`);

  // 2. Store Owner Sign In via Email
  console.log('\n2. Testing Store Owner Sign In via Email...');
  const storeLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'admin@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(storeLoginRes.status === 200, `Store Admin login returns 200 OK`);
  assert(storeLoginRes.body.success === true, `Response success is true`);
  assert(!!storeLoginRes.body.token, `JWT authorization token is present`);
  const user = storeLoginRes.body.user;
  assert(user.role === 'STORE_ADMIN', `User role is STORE_ADMIN (routes to /dashboard)`);
  assert(user.tenantId === 'tenant_1', `User scoped to tenantId: ${user.tenantId}`);
  assert(!!user.tenantName, `tenantName returned: "${user.tenantName}"`);
  assert(!!storeLoginRes.body.tenant, `tenant object returned in payload`);
  assert(storeLoginRes.body.tenant.status === 'active', `tenant.status is active`);

  // 3. Store Owner Sign In via Mobile Phone
  console.log('\n3. Testing Store Owner Sign In via Mobile Phone Number...');
  const phoneLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      identifier: '+92 300 1234567',
      password: 'admin123',
    },
  });
  assert(phoneLoginRes.status === 200, `Sign In via mobile phone number returns 200 OK`);
  assert(phoneLoginRes.body.user.email === 'admin@naveedpos.com', `Resolved to correct user by phone number`);

  // 4. Super Admin Sign In & Auto-Routing
  console.log('\n4. Testing Super Admin Sign In (/api/auth/login)...');
  const superLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'naveed@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(superLoginRes.status === 200, `Super Admin login returns 200 OK`);
  const superUser = superLoginRes.body.user;
  assert(superUser.role === 'SUPER_ADMIN', `User role is SUPER_ADMIN (routes to /super-admin)`);
  assert(superUser.tenantId === null, `Super Admin tenantId is null (global scope)`);

  // 5. Suspended Store Lockout Banner Check
  console.log('\n5. Testing Suspended Store Lockout Behavior...');
  const suspendedRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'metro@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(suspendedRes.status === 403, `Suspended store is blocked with 403 Forbidden`);
  assert(suspendedRes.body.code === 'SUBSCRIPTION_LOCKED', `Error code is SUBSCRIPTION_LOCKED`);
  assert(
    typeof suspendedRes.body.message === 'string' && suspendedRes.body.message.length > 0,
    `Clear user-facing subscription message provided: "${suspendedRes.body.message}"`
  );

  // 6. Sign Up (Instant 14-Day Free Trial Auto-Provisioning)
  console.log('\n6. Testing Tab 2: Instant 14-Day Free Trial Sign Up (/api/auth/register-trial)...');
  const uniqueId = Date.now().toString().slice(-4);
  const trialPayload = {
    shopName: `Kashmir Mart ${uniqueId}`,
    ownerName: 'Farhan Tariq',
    phone: '0345-9876543',
    email: `farhan_${uniqueId}@kashmirmart.pk`,
    password: 'trialPassword123',
    city: 'Muzaffarabad',
  };

  const registerRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/register-trial',
    body: trialPayload,
  });
  assert(registerRes.status === 201, `register-trial returns 201 Created (Received: ${registerRes.status})`);
  assert(registerRes.body.success === true, `Response success is true`);
  assert(!!registerRes.body.token, `JWT token auto-issued for seamless entry to /dashboard`);
  const newTenantUser = registerRes.body.user;
  assert(newTenantUser.role === 'STORE_ADMIN', `New owner assigned role: STORE_ADMIN`);
  assert(!!newTenantUser.tenantId, `New owner attached to created tenantId: ${newTenantUser.tenantId}`);

  // Verify 14-day validity window
  const newTenant = registerRes.body.tenant;
  assert(newTenant.status === 'trial', `Tenant status is 'trial'`);
  const expiryDate = new Date(newTenant.subscriptionExpiresAt);
  const now = new Date();
  const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  assert(diffDays === 14, `Trial subscription period is exactly 14 days (Computed: ${diffDays} days)`);

  // Verify starter catalog auto-provisioned
  const catalogRes = await makeRequest({
    method: 'GET',
    path: '/api/products',
    token: registerRes.body.token,
  });
  assert(catalogRes.status === 200, `New store catalog is accessible`);
  assert(catalogRes.body.count >= 4, `Starter retail inventory products auto-seeded (${catalogRes.body.count} items)`);

  // 7. Duplicate Email Sign-Up Guard
  console.log('\n7. Testing Duplicate Email Sign-Up Guard...');
  const duplicateRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/register-trial',
    body: trialPayload,
  });
  assert(duplicateRes.status === 400, `Duplicate email registration rejected with 400`);
  assert(
    duplicateRes.body.message.includes('already exists'),
    `Helpful error returned: "${duplicateRes.body.message}"`
  );

  console.log('\n=== ALL 22 SIMPLIFIED TWO-OPTION AUTH PORTAL TESTS PASSED! ===');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
