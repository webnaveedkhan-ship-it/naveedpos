// server/test/themeAndRegressionTest.js
// Regression test verifying Theme setup, zero sales tax, trial provisioning,
// low stock alerts, visual analytics, and core platform operations.

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5055';

function request(method, pathUrl, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function run() {
  console.log('🚀 Running Theme & Regression Test Suite for NaveedPOS...\n');

  // 1. Verify Dark & Light Mode Option Removal
  console.log('--- 1. Theme Option Removal Verification ---');
  const indexHtmlPath = path.resolve(__dirname, '../../client/index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  assert(!indexHtml.includes("document.documentElement.classList.add('dark')"), 'index.html no longer adds .dark class');
  assert(indexHtml.includes("document.documentElement.classList.remove('dark')"), 'index.html clears any lingering .dark class');

  const navbarPath = path.resolve(__dirname, '../../client/src/components/common/Navbar.jsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  assert(!navbarContent.includes('useTheme'), 'Navbar.jsx does not use ThemeContext');
  assert(!navbarContent.includes('toggleTheme'), 'Navbar.jsx has no theme toggle option');
  assert(!navbarContent.includes('Switch to Dark Mode'), 'Theme toggle button removed from Navbar.jsx');

  const loginPagePath = path.resolve(__dirname, '../../client/src/pages/LoginPage.jsx');
  const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
  assert(!loginPageContent.includes('useTheme'), 'LoginPage.jsx does not use ThemeContext');
  assert(!loginPageContent.includes('toggleTheme'), 'Floating theme toggle removed from LoginPage.jsx');

  const appPath = path.resolve(__dirname, '../../client/src/App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  assert(!appContent.includes('ThemeProvider'), 'App.jsx does not mount ThemeProvider');

  // 2. Super Admin Login
  console.log('\n--- 2. Super Admin Access Verification ---');
  const saLogin = await request('POST', '/api/auth/login', {
    email: 'naveed@naveedpos.com',
    password: 'admin123',
  });
  assert(saLogin.status === 200, 'Super Admin logs in successfully (200)');
  assert(saLogin.body.user && saLogin.body.user.role === 'SUPER_ADMIN', 'Super Admin role verified');
  const saToken = saLogin.body.token;

  // 3. 14-Day Free Trial Auto-Registration
  console.log('\n--- 3. 14-Day Free Trial Registration & Zero-Tax Verification ---');
  const uniqueStore = `theme_test_${Date.now()}`;
  const uniquePhone = `0300${Date.now().toString().slice(-7)}`;
  const trialRes = await request('POST', '/api/auth/register-trial', {
    shopName: `Theme Mart ${uniqueStore}`,
    ownerName: 'Hamza Khan',
    email: `${uniqueStore}@testmart.pk`,
    phone: uniquePhone,
    password: 'password123',
  });
  assert(trialRes.status === 201, 'Trial store registered successfully (201)');
  assert(trialRes.body.token, 'JWT token returned on registration');
  assert(trialRes.body.tenant && trialRes.body.tenant.status === 'trial', 'Tenant status is trial');
  assert(
    (trialRes.body.tenant.settings?.taxRate ?? trialRes.body.tenant.taxRate) === 0,
    'Zero Sales Tax rule enforced on store creation (taxRate === 0)'
  );
  const clientToken = trialRes.body.token;

  // 4. Phone Login Test
  console.log('\n--- 4. Multi-Identifier Phone Login Verification ---');
  const phoneLogin = await request('POST', '/api/auth/login', {
    identifier: uniquePhone,
    password: 'password123',
  });
  assert(phoneLogin.status === 200, 'Store Admin logs in with unformatted phone number (200)');
  assert(phoneLogin.body.user.email === `${uniqueStore}@testmart.pk`, 'Phone identifier resolved to correct user');

  // 5. Create Catalog Product & Low Stock Test
  console.log('\n--- 5. Low Stock Alert & Inventory Restock Verification ---');
  const createProdRes = await request(
    'POST',
    '/api/products',
    {
      title: 'Theme Wireless Mouse',
      category: 'Electronics',
      price: 1500,
      costPrice: 900,
      stockQuantity: 2,
      lowStockAlert: 5,
      sku: `SKU-${Date.now()}`,
    },
    { Authorization: `Bearer ${clientToken}` }
  );
  assert(createProdRes.status === 201, 'Low-stock test product created (201)');
  const productId = createProdRes.body.product._id;

  const lowStockRes = await request('GET', '/api/products/low-stock', null, {
    Authorization: `Bearer ${clientToken}`,
  });
  assert(lowStockRes.status === 200, 'Low-stock endpoint returns 200');
  const items = lowStockRes.body.items || lowStockRes.body.products || [];
  assert(Array.isArray(items), 'Low-stock returns array of products');
  const isFoundInLowStock = items.some((p) => p._id === productId);
  assert(isFoundInLowStock, 'Newly created item appears in low-stock alerts list');

  // Quick Restock Product
  const restockRes = await request(
    'PATCH',
    `/api/products/${productId}/restock`,
    {
      quantityToAdd: 20,
      newCostPrice: 850,
    },
    { Authorization: `Bearer ${clientToken}` }
  );
  assert(restockRes.status === 200, 'Quick restock PATCH endpoint returns 200');
  assert(restockRes.body.product.stockQuantity === 22, 'Stock quantity updated to 22 units');

  // 6. Visual Analytics & Synchronized Reporting
  console.log('\n--- 6. Visual Analytics & Reporting Verification ---');
  const reportsRes = await request('GET', '/api/reports/visual-analytics?period=daily', null, {
    Authorization: `Bearer ${clientToken}`,
  });
  assert(reportsRes.status === 200, 'GET /api/reports/visual-analytics returns 200');
  assert(reportsRes.body.kpis, 'Visual analytics returns kpis payload');
  assert(reportsRes.body.timelineChart, 'Visual analytics returns timelineChart');
  assert(reportsRes.body.paymentMethods, 'Visual analytics returns paymentMethods');

  console.log('\n🎉 ALL THEME & REGRESSION TESTS PASSED SUCCESSFULLY! (100% Green)\n');
}

run().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
