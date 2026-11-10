/**
 * Comprehensive 3-Tier SaaS & Retail Automation Test Suite
 * Tests:
 * 1. Plan limits & feature gating across Basic, Standard, and Premium tiers
 * 2. Super Admin plan switching (PUT /api/tenants/:id/plan)
 * 3. Store Admin billing self-service (GET /api/tenants/billing)
 * 4. Cash Drawer Reconciliation (Sham ka Hisaab - GET summary, POST reconcile, GET history)
 * 5. Full Store Backup JSON Snapshot Export (GET /api/backup/export)
 * 6. Fractional units & Loose weight pricing gating
 * 7. Subscription payment submission and Super Admin approval
 */

const http = require('http');

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🚀 RUNNING 3-TIER SAAS & RETAIL AUTOMATION INTEGRATION TESTS');
  console.log('================================================================\n');

  let superAdminToken = '';
  let storeAdminToken = '';
  let tenant1Id = 'tenant_1';
  let submittedPaymentId = '';

  // 1. Health check
  console.log('1. Health Check');
  const healthRes = await makeRequest('GET', '/api/health');
  assert(healthRes.status === 200, 'Server health check returned 200 OK');
  assert(healthRes.data.status === 'online', 'Server status is online');

  // 2. Login Super Admin
  console.log('\n2. Authenticating Super Admin');
  const superLoginRes = await makeRequest('POST', '/api/auth/login', {
    email: 'naveed@naveedpos.com',
    password: 'admin123',
  });
  assert(superLoginRes.status === 200, 'Super Admin logged in successfully');
  assert(superLoginRes.data.user.role === 'SUPER_ADMIN', 'User role is SUPER_ADMIN');
  superAdminToken = superLoginRes.data.token;

  // 3. Super Admin Tenancy Overview
  console.log('\n3. Super Admin Tenancy & Metrics');
  const tenantsRes = await makeRequest('GET', '/api/tenants', null, {
    Authorization: `Bearer ${superAdminToken}`,
  });
  assert(tenantsRes.status === 200, 'Tenants list retrieved successfully');
  assert(Array.isArray(tenantsRes.data.tenants), 'Tenants is an array');
  const t1 = tenantsRes.data.tenants.find((t) => t._id === tenant1Id);
  assert(t1 !== undefined, 'Found tenant_1 (AL MADINA SUPER MART)');
  assert(t1.planLimits !== undefined, 'Tenant has planLimits configured');

  // 4. Switch Tenant 1 to BASIC Plan
  console.log('\n4. Super Admin Switches Store to BASIC Plan');
  const setBasicRes = await makeRequest(
    'PUT',
    `/api/tenants/${tenant1Id}/plan`,
    { plan: 'basic', extendDays: 30 },
    { Authorization: `Bearer ${superAdminToken}` }
  );
  assert(setBasicRes.status === 200, 'Switched to Basic plan successfully');
  assert(setBasicRes.data.tenant.plan === 'basic', 'Tenant plan is now basic');
  assert(setBasicRes.data.tenant.planLimits.maxProducts === 300, 'Basic maxProducts is 300');
  assert(setBasicRes.data.tenant.planLimits.maxKhataCustomers === 50, 'Basic maxKhataCustomers is 50');
  assert(setBasicRes.data.tenant.planLimits.allowWhatsApp === false, 'Basic allowWhatsApp is false');
  assert(setBasicRes.data.tenant.planLimits.allowBarcodeGen === false, 'Basic allowBarcodeGen is false');
  assert(
    setBasicRes.data.tenant.planLimits.allowDrawerReconciliation === false,
    'Basic allowDrawerReconciliation is false'
  );
  assert(
    setBasicRes.data.tenant.planLimits.allowFractionalUnits === false,
    'Basic allowFractionalUnits is false'
  );
  assert(
    setBasicRes.data.tenant.planLimits.allowBackupExport === false,
    'Basic allowBackupExport is false'
  );

  // 5. Login as Store Admin (AL MADINA)
  console.log('\n5. Authenticating Store Admin on Basic Plan');
  const storeLoginRes = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@naveedpos.com',
    password: 'admin123',
  });
  assert(storeLoginRes.status === 200, 'Store Admin logged in successfully');
  storeAdminToken = storeLoginRes.data.token;

  // 6. Test Store Billing Endpoint
  console.log('\n6. Checking Store Billing & Usage Quotas');
  const billingRes = await makeRequest('GET', '/api/tenants/billing', null, {
    Authorization: `Bearer ${storeAdminToken}`,
  });
  assert(billingRes.status === 200, 'Billing details retrieved');
  assert(billingRes.data.billing.plan === 'basic', 'Billing shows basic plan');
  assert(billingRes.data.billing.usage !== undefined, 'Billing returns resource usage metrics');

  // 7. Verify Gating on BASIC Plan (Expect 403 Forbidden)
  console.log('\n7. Testing Basic Plan Feature Gates (Expected 403 Block)');

  // 7a. Fractional Units Gate
  const fractionalProductRes = await makeRequest(
    'POST',
    '/api/products',
    {
      title: 'Basmati Rice Premium (Loose)',
      sku: 'RICE-KG-01',
      price: 380,
      costPrice: 320,
      category: 'Grains & Pulses',
      stockQuantity: 100,
      unitType: 'kg',
      allowFractional: true,
    },
    { Authorization: `Bearer ${storeAdminToken}` }
  );
  assert(
    fractionalProductRes.status === 403,
    'Basic plan blocks fractional loose weight creation (HTTP 403)'
  );
  assert(
    fractionalProductRes.data.code === 'PLAN_LIMIT_REACHED',
    'Error code is PLAN_LIMIT_REACHED'
  );

  // 7b. Backup Export Gate
  const backupRes = await makeRequest('GET', '/api/backup/export', null, {
    Authorization: `Bearer ${storeAdminToken}`,
  });
  assert(backupRes.status === 403, 'Basic plan blocks backup export (HTTP 403)');
  assert(backupRes.data.code === 'PLAN_LIMIT_REACHED', 'Error code is PLAN_LIMIT_REACHED');

  // 7c. Cash Drawer Gate
  const reconcileBlockedRes = await makeRequest(
    'POST',
    '/api/cash-drawer/reconcile',
    {
      openingCash: 5000,
      countedCash: 12500,
      notes: 'Testing basic block',
    },
    { Authorization: `Bearer ${storeAdminToken}` }
  );
  assert(
    reconcileBlockedRes.status === 403,
    'Basic plan blocks cash drawer reconciliation (HTTP 403)'
  );

  // 8. Super Admin Upgrades Store to STANDARD Plan
  console.log('\n8. Super Admin Upgrades Store to STANDARD Plan (Rs. 3,000/mo)');
  const setStandardRes = await makeRequest(
    'PUT',
    `/api/tenants/${tenant1Id}/plan`,
    { plan: 'standard', extendDays: 30 },
    { Authorization: `Bearer ${superAdminToken}` }
  );
  assert(setStandardRes.status === 200, 'Switched to Standard plan successfully');
  assert(setStandardRes.data.tenant.plan === 'standard', 'Tenant plan is now standard');
  assert(
    setStandardRes.data.tenant.planLimits.maxProducts === 1500,
    'Standard maxProducts is 1,500'
  );
  assert(
    setStandardRes.data.tenant.planLimits.maxKhataCustomers >= 10000,
    'Standard khata is unlimited'
  );
  assert(
    setStandardRes.data.tenant.planLimits.allowWhatsApp === true,
    'Standard allowWhatsApp is true'
  );
  assert(
    setStandardRes.data.tenant.planLimits.allowBarcodeGen === true,
    'Standard allowBarcodeGen is true'
  );
  assert(
    setStandardRes.data.tenant.planLimits.allowDrawerReconciliation === true,
    'Standard allowDrawerReconciliation is true'
  );

  // 9. Store Admin Uses STANDARD Features: Cash Drawer Reconciliation
  console.log('\n9. Testing Standard Plan: Cash Drawer (Sham ka Hisaab)');

  // 9a. Drawer Summary Today
  const drawerSummaryRes = await makeRequest(
    'GET',
    '/api/cash-drawer/summary-today',
    null,
    { Authorization: `Bearer ${storeAdminToken}` }
  );
  assert(drawerSummaryRes.status === 200, 'Cash drawer summary retrieved');
  assert(drawerSummaryRes.data.summary !== undefined, 'Summary object present');
  const opening = 5000;
  const netChange = Number(drawerSummaryRes.data.summary.netCashChange || 0);
  const expectedInDrawer = opening + netChange;
  const countedCash = expectedInDrawer + 100; // Rs. 100 surplus
  console.log(`    System expected cash in drawer: Rs. ${expectedInDrawer}`);

  // 9b. Reconcile with Pakistani Banknotes
  const reconcileRes = await makeRequest(
    'POST',
    '/api/cash-drawer/reconcile',
    {
      openingCash: opening,
      countedCash,
      denominations: [
        { note: 5000, count: 1, subtotal: 5000 },
        { note: 1000, count: 5, subtotal: 5000 },
        { note: 500, count: Math.max(0, Math.floor((countedCash - 10000) / 500)), subtotal: 0 },
      ],
      notes: 'Day-end drawer check by cashier Asif - Rs. 100 surplus',
    },
    { Authorization: `Bearer ${storeAdminToken}` }
  );
  assert(reconcileRes.status === 201, 'Cash drawer reconciled successfully (HTTP 201)');
  assert(reconcileRes.data.reconciliation.status === 'SURPLUS', 'Status detected as SURPLUS');
  assert(
    reconcileRes.data.reconciliation.difference === 100,
    'Calculated difference is exactly +100'
  );

  // 9c. Drawer History
  const historyRes = await makeRequest('GET', '/api/cash-drawer/history', null, {
    Authorization: `Bearer ${storeAdminToken}`,
  });
  assert(historyRes.status === 200, 'Cash drawer history retrieved');
  const historyList = historyRes.data.history || historyRes.data.reconciliations;
  assert(Array.isArray(historyList), 'History is an array');
  assert(historyList.length > 0, 'History contains today’s audit record');

  // 10. Super Admin Upgrades Store to PREMIUM Plan (Rs. 5,500/mo)
  console.log('\n10. Super Admin Upgrades Store to PREMIUM Plan');
  const setPremiumRes = await makeRequest(
    'PUT',
    `/api/tenants/${tenant1Id}/plan`,
    { plan: 'premium', extendDays: 60 },
    { Authorization: `Bearer ${superAdminToken}` }
  );
  assert(setPremiumRes.status === 200, 'Switched to Premium plan successfully');
  assert(setPremiumRes.data.tenant.plan === 'premium', 'Tenant plan is now premium');
  assert(
    setPremiumRes.data.tenant.planLimits.allowFractionalUnits === true,
    'Premium allowFractionalUnits is true'
  );
  assert(
    setPremiumRes.data.tenant.planLimits.allowBackupExport === true,
    'Premium allowBackupExport is true'
  );
  assert(
    setPremiumRes.data.tenant.planLimits.maxProducts >= 999999,
    'Premium maxProducts is unlimited'
  );

  // 11. Store Admin Uses PREMIUM Features
  console.log('\n11. Testing Premium Plan: Fractional Pricing & Full Shop Backup');

  // 11a. Create Fractional Loose Weight Product
  const uniqueSku = `RICE-PREM-${Date.now()}`;
  const createRiceRes = await makeRequest(
    'POST',
    '/api/products',
    {
      title: 'Basmati Super Kernel Rice (Loose)',
      sku: uniqueSku,
      price: 360,
      costPrice: 290,
      category: 'Grains & Pulses',
      stockQuantity: 250,
      unitType: 'kg',
      allowFractional: true,
      cartonSize: 25,
      cartonPrice: 8500,
    },
    { Authorization: `Bearer ${storeAdminToken}` }
  );
  assert(createRiceRes.status === 201, 'Created fractional unit product on Premium (HTTP 201)');
  assert(
    createRiceRes.data.product.allowFractional === true,
    'Product saved with allowFractional: true'
  );

  // 11b. Export Full Shop Backup
  const fullBackupRes = await makeRequest('GET', '/api/backup/export', null, {
    Authorization: `Bearer ${storeAdminToken}`,
  });
  assert(fullBackupRes.status === 200, 'Full backup exported successfully (HTTP 200)');
  assert(
    fullBackupRes.data.exportedAt !== undefined,
    'Backup includes exportedAt timestamp'
  );
  assert(
    fullBackupRes.data.store !== undefined,
    'Backup contains complete store metadata'
  );
  assert(
    Array.isArray(fullBackupRes.data.catalog),
    'Backup includes catalog items'
  );
  assert(
    Array.isArray(fullBackupRes.data.orders),
    'Backup includes orders'
  );
  assert(
    Array.isArray(fullBackupRes.data.khataLedgers),
    'Backup includes khata ledgers'
  );
  assert(
    Array.isArray(fullBackupRes.data.expenses),
    'Backup includes expenses'
  );
  assert(
    Array.isArray(fullBackupRes.data.suppliers),
    'Backup includes wholesale suppliers'
  );
  assert(
    Array.isArray(fullBackupRes.data.wholesalePurchases),
    'Backup includes purchase invoices'
  );

  // 12. Submit Payment Verification Proof (Self-Service Renewal)
  console.log('\n12. Store Admin Submits Subscription Payment Proof');
  const submitPayRes = await makeRequest(
    'POST',
    '/api/tenants/billing/payment',
    {
      amount: 5500,
      billingCycle: 'monthly',
      paymentMethod: 'JAZZCASH',
      transactionId: `TID-JAZZ-${Date.now()}`,
      receiptUrl: 'https://example.com/receipt.jpg',
      targetPlan: 'premium',
    },
    { Authorization: `Bearer ${storeAdminToken}` }
  );
  assert(submitPayRes.status === 201, 'Payment verification submitted (HTTP 201)');
  submittedPaymentId = submitPayRes.data.payment._id;
  assert(submittedPaymentId !== undefined, 'Payment record ID generated');

  // 13. Super Admin Approves Payment Verification
  console.log('\n13. Super Admin Approves Payment Proof');
  const approveRes = await makeRequest(
    'PUT',
    `/api/tenants/payments/${submittedPaymentId}/approve`,
    null,
    { Authorization: `Bearer ${superAdminToken}` }
  );
  assert(approveRes.status === 200, 'Payment approved by Super Admin (HTTP 200)');
  assert(approveRes.data.payment.status === 'approved', 'Payment status is now approved');

  console.log('\n================================================================');
  console.log('🎉 ALL 3-TIER SAAS & RETAIL AUTOMATION TESTS PASSED (13/13)!');
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
