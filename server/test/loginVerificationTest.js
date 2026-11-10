const http = require('http');

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 Starting Authentication Verification Tests');
  console.log('==================================================\n');

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

  // 1. Email login: Store Owner
  const res1 = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@naveedpos.com',
    password: 'admin123',
  });
  assert(res1.status === 200 && res1.data.token, 'Email login: admin@naveedpos.com / admin123');

  // 2. Email login: Super Admin
  const res2 = await makeRequest('POST', '/api/auth/login', {
    email: 'naveed@naveedpos.com',
    password: 'admin123',
  });
  assert(res2.status === 200 && res2.data.user.role === 'SUPER_ADMIN', 'Super Admin: naveed@naveedpos.com / admin123');

  // 3. Phone login: 03001234567
  const res3 = await makeRequest('POST', '/api/auth/login', {
    identifier: '03001234567',
    password: 'admin123',
  });
  assert(res3.status === 200 && res3.data.user.email === 'admin@naveedpos.com', 'Phone standard: 03001234567');

  // 4. Phone login with spaces: 0300 1234567
  const res4 = await makeRequest('POST', '/api/auth/login', {
    identifier: '0300 1234567',
    password: 'admin123',
  });
  assert(res4.status === 200 && res4.data.user.email === 'admin@naveedpos.com', 'Phone with spaces: 0300 1234567');

  // 5. Phone login with dashes: 0300-1234567
  const res5 = await makeRequest('POST', '/api/auth/login', {
    identifier: '0300-1234567',
    password: 'admin123',
  });
  assert(res5.status === 200 && res5.data.user.email === 'admin@naveedpos.com', 'Phone with dashes: 0300-1234567');

  // 6. Phone login international: +92 300 1234567
  const res6 = await makeRequest('POST', '/api/auth/login', {
    identifier: '+92 300 1234567',
    password: 'admin123',
  });
  assert(res6.status === 200 && res6.data.user.email === 'admin@naveedpos.com', 'Phone international: +92 300 1234567');

  // 7. Username alias: 'admin'
  const res7 = await makeRequest('POST', '/api/auth/login', {
    identifier: 'admin',
    password: 'admin123',
  });
  assert(res7.status === 200 && res7.data.user.email === 'admin@naveedpos.com', "Username alias: 'admin'");

  // 8. Username alias: 'naveed'
  const res8 = await makeRequest('POST', '/api/auth/login', {
    identifier: 'naveed',
    password: 'admin123',
  });
  assert(res8.status === 200 && res8.data.user.role === 'SUPER_ADMIN', "Username alias: 'naveed'");

  // 9. Password with accidental trailing space: 'admin123 '
  const res9 = await makeRequest('POST', '/api/auth/login', {
    identifier: 'admin@naveedpos.com',
    password: 'admin123 ',
  });
  assert(res9.status === 200, 'Password tolerance: trailing whitespace handled gracefully');

  // 10. Wrong password informative message
  const res10 = await makeRequest('POST', '/api/auth/login', {
    identifier: 'admin@naveedpos.com',
    password: 'wrongpassword',
  });
  assert(
    res10.status === 401 && res10.data.message.includes('admin123'),
    `Wrong password error message is helpful: "${res10.data.message}"`
  );

  // 11. Non-existent account informative message
  const res11 = await makeRequest('POST', '/api/auth/login', {
    identifier: 'unknown@email.com',
    password: 'somepassword',
  });
  assert(
    res11.status === 401 && res11.data.message.includes('admin@naveedpos.com'),
    `Non-existent account error message is helpful: "${res11.data.message}"`
  );

  console.log('\n==================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
