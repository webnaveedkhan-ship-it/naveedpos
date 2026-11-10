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
  console.log('=== Starting NaveedPOS Role-Segmented Auth Portal & Branding Tests ===\n');

  // 1. Dynamic Store Identity Lookup by Email
  console.log('1. Testing Dynamic Store Identity Lookup by Email (/api/auth/identify-store)...');
  const identifyEmailRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/identify-store',
    body: { identifier: 'admin@naveedpos.com' },
  });

  assert(identifyEmailRes.status === 200, 'Identify endpoint returned HTTP 200');
  assert(identifyEmailRes.body.success === true, 'Response success is true');
  assert(identifyEmailRes.body.identified === true, 'Store successfully identified');
  assert(
    identifyEmailRes.body.storeName === 'Al-Madina Superstore (Lahore)',
    `Store name identified as "${identifyEmailRes.body.storeName}"`
  );
  assert(identifyEmailRes.body.isSubscribed === true, 'Store marked as subscribed merchant');

  // 2. Dynamic Store Identity Lookup by Slug
  console.log('\n2. Testing Dynamic Store Identity Lookup by Store Slug (/api/auth/identify-store)...');
  const identifySlugRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/identify-store',
    body: { identifier: 'khan-mart-karachi' },
  });

  assert(identifySlugRes.status === 200, 'Identify slug returned HTTP 200');
  assert(identifySlugRes.body.identified === true, 'Slug identified');
  assert(
    identifySlugRes.body.storeName.includes('Khan Electronics'),
    'Karachi store name correctly resolved'
  );

  // 3. Dynamic Store Identity Negative / Non-Existent Lookup
  console.log('\n3. Testing Unknown Identifier Lookup (/api/auth/identify-store)...');
  const unknownRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/identify-store',
    body: { identifier: 'unknown_shopper@gmail.com' },
  });

  assert(unknownRes.status === 200, 'Unknown identifier returned HTTP 200');
  assert(unknownRes.body.identified === false, 'Correctly identified as false');

  // 4. Store Owner Login Flow
  console.log('\n4. Testing Active Store Owner Sign-In (/api/auth/login)...');
  const storeLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'admin@naveedpos.com',
      password: 'admin123',
    },
  });

  assert(storeLoginRes.status === 200, 'Store owner login returned HTTP 200');
  assert(storeLoginRes.body.user.role === 'STORE_ADMIN', 'User role is STORE_ADMIN');
  assert(!!storeLoginRes.body.user.tenantId, 'User scoped to tenantId');
  assert(
    storeLoginRes.body.user.tenantName.includes('Al-Madina'),
    'Store tenantName correctly attached'
  );

  // 5. Super Admin Login Flow
  console.log('\n5. Testing Super Admin Master Console Sign-In (/api/auth/login)...');
  const superLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'naveed@naveedpos.com',
      password: 'admin123',
    },
  });

  assert(superLoginRes.status === 200, 'Super admin login returned HTTP 200');
  assert(superLoginRes.body.user.role === 'SUPER_ADMIN', 'User role is SUPER_ADMIN');
  assert(superLoginRes.body.user.tenantId === null, 'Super admin tenantId is null (global scope)');

  // 6. Suspended Tenant Lockout on Login
  console.log('\n6. Testing Suspended Store Login Lockout (/api/auth/login)...');
  const suspendedLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'metro@naveedpos.com',
      password: 'admin123',
    },
  });

  assert(suspendedLoginRes.status === 403, 'Suspended store rejected with HTTP 403');
  assert(
    suspendedLoginRes.body.code === 'SUBSCRIPTION_LOCKED',
    'Rejection code is SUBSCRIPTION_LOCKED'
  );

  // 7. 14-Day Free Trial Auto-Provisioning Flow
  console.log('\n7. Testing 14-Day Free Trial Onboarding (/api/auth/register-trial)...');
  const uniqueNum = Math.floor(1000 + Math.random() * 9000);
  const trialRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/register-trial',
    body: {
      shopName: `Faisalabad Cash & Carry ${uniqueNum}`,
      ownerName: 'Rashid Minhas',
      phone: '0300-7654321',
      city: 'Faisalabad',
      email: `rashid_${uniqueNum}@faisalabadmart.pk`,
      password: 'trialPassword123!',
    },
  });

  assert(trialRes.status === 201, 'Trial store creation returned HTTP 201');
  assert(trialRes.body.success === true, 'Trial created successfully');
  assert(trialRes.body.user.role === 'STORE_ADMIN', 'Trial user has STORE_ADMIN role');
  assert(!!trialRes.body.token, 'Auto JWT token issued for immediate dashboard access');

  console.log('\n=== Role-Segmented Auth Portal & Dynamic Branding: ALL 18 TESTS PASSED ===\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
