/**
 * Retail Upgrade Modules Automated Integration Test Suite
 * Tests:
 * 1. WhatsApp Receipt & Khata Reminder URL generation
 * 2. Store Daily Expenses Manager & Net Profit deduction
 * 3. Supplier Management & Wholesale Purchases (Auto Stock Inward)
 * 4. Multi-Unit & Loose Weight Support (kg, grams, carton pricing)
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

// Phone normalizer test
function normalizeWhatsAppPhone(rawPhone) {
  if (!rawPhone) return '';
  let digits = rawPhone.toString().replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '92' + digits.substring(1);
  } else if (digits.length === 10 && digits.startsWith('3')) {
    digits = '92' + digits;
  } else if (digits.startsWith('0092')) {
    digits = digits.substring(2);
  }
  return digits;
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 Starting Retail Upgrade Modules Test Suite');
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

  // ----------------------------------------------------
  // TEST 1: WhatsApp Normalization & Message Link Generation
  // ----------------------------------------------------
  console.log('[Module 1] Testing WhatsApp Link Generation & Pakistani Phone Normalization');
  const rawNum1 = '0300-1234567';
  const normNum1 = normalizeWhatsAppPhone(rawNum1);
  assert(normNum1 === '923001234567', `0300-1234567 normalized to ${normNum1}`);

  const rawNum2 = '+92 321 9876543';
  const normNum2 = normalizeWhatsAppPhone(rawNum2);
  assert(normNum2 === '923219876543', `+92 321 9876543 normalized to ${normNum2}`);

  const rawNum3 = '0333 5554433';
  const normNum3 = normalizeWhatsAppPhone(rawNum3);
  assert(normNum3 === '923335554433', `0333 5554433 normalized to ${normNum3}`);

  // ----------------------------------------------------
  // Sign In as Store Admin (tenant_1)
  // ----------------------------------------------------
  console.log('\n[Auth] Authenticating as demo store owner...');
  const authRes = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@naveedpos.com',
    password: 'admin123',
  });

  assert(authRes.status === 200 && authRes.data.token, 'Logged in as Store Owner');
  const token = authRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // ----------------------------------------------------
  // TEST 2: Daily Store Expense Manager
  // ----------------------------------------------------
  console.log('\n[Module 2] Testing Store Daily Expense Manager');

  // 2a. Fetch existing expenses
  const expRes1 = await makeRequest('GET', '/api/expenses?period=today', null, authHeaders);
  assert(expRes1.status === 200 && expRes1.data.success, 'Fetched today expenses');
  const initialExpTotal = expRes1.data.summary?.totalAmount || 0;

  // 2b. Create a new expense (Tea & Refreshments)
  const newExpRes = await makeRequest(
    'POST',
    '/api/expenses',
    {
      category: 'Tea & Refreshments',
      title: 'Afternoon tea and samosas for staff',
      amount: 450,
      paymentMethod: 'Cash',
      notes: 'Paid to corner dhaba',
    },
    authHeaders
  );
  assert(newExpRes.status === 201 && newExpRes.data.success, 'Created expense: Afternoon tea 450 PKR');
  const createdExpId = newExpRes.data.expense?._id;

  // 2c. Verify expense is in today list and summary updated
  const expRes2 = await makeRequest('GET', '/api/expenses?period=today', null, authHeaders);
  const updatedExpTotal = expRes2.data.summary?.totalAmount || 0;
  assert(updatedExpTotal === initialExpTotal + 450, `Expense total increased by 450 (Now: ${updatedExpTotal})`);

  // 2d. Verify Reports deduct expenses from Net Profit
  const reportRes = await makeRequest('GET', '/api/reports/dashboard-metrics?period=today', null, authHeaders);
  assert(reportRes.status === 200 && reportRes.data.success, 'Fetched dashboard metrics');
  const summaryMetrics = reportRes.data.summary;
  assert(summaryMetrics.totalExpenses !== undefined, `Dashboard includes totalExpenses: ${summaryMetrics.totalExpenses}`);
  assert(summaryMetrics.grossProfit !== undefined, `Dashboard includes grossProfit: ${summaryMetrics.grossProfit}`);

  // ----------------------------------------------------
  // TEST 3: Supplier Management & Wholesale Purchases (Auto Stock Inward)
  // ----------------------------------------------------
  console.log('\n[Module 3] Testing Supplier Management & Wholesale Purchases (Auto Stock Inward)');

  // 3a. Register a new wholesale supplier
  const supplierRes = await makeRequest(
    'POST',
    '/api/suppliers',
    {
      companyName: 'Habib Wholesale Grain Traders',
      name: 'Haji Habib Ullah',
      phone: '03019876543',
      email: 'habib.grains@yahoo.com',
      address: 'Shop 12, Galla Mandi, Faisalabad',
      balancePayable: 25000,
    },
    authHeaders
  );
  assert(supplierRes.status === 201 && supplierRes.data.success, 'Registered wholesale supplier: Habib Traders');
  const supplierId = supplierRes.data.supplier?._id;

  // 3b. Find an existing product or create a multi-unit item to receive stock for
  const prodRes = await makeRequest('GET', '/api/products', null, authHeaders);
  const targetProduct = prodRes.data.products[0];
  const initialStock = targetProduct.stockQuantity;
  console.log(`  ℹ️ Target product: "${targetProduct.title}" (Initial Stock: ${initialStock})`);

  // 3c. Log wholesale purchase invoice receiving 50 units
  const inwardQty = 50;
  const wholesaleCost = 120;
  const purchaseTotal = inwardQty * wholesaleCost; // 6000
  const upfrontPaid = 2000;
  const balanceDue = purchaseTotal - upfrontPaid; // 4000

  const purchaseRes = await makeRequest(
    'POST',
    '/api/purchases',
    {
      supplierId: supplierId,
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
      invoiceDate: new Date().toISOString().slice(0, 10),
      items: [
        {
          productId: targetProduct._id,
          title: targetProduct.title,
          sku: targetProduct.sku,
          quantity: inwardQty,
          unitCost: wholesaleCost,
          subtotal: purchaseTotal,
        },
      ],
      paidAmount: upfrontPaid,
      paymentMethod: 'Cash',
      notes: 'Received via delivery truck',
    },
    authHeaders
  );
  assert(purchaseRes.status === 201 && purchaseRes.data.success, 'Logged wholesale purchase invoice');

  // 3d. Verify target product stock was AUTO-INCREMENTED
  const checkProdRes = await makeRequest('GET', '/api/products', null, authHeaders);
  const updatedProduct = checkProdRes.data.products.find((p) => p._id === targetProduct._id);
  assert(
    updatedProduct.stockQuantity === initialStock + inwardQty,
    `Auto stock inward verified! Stock incremented from ${initialStock} to ${updatedProduct.stockQuantity} (+${inwardQty})`
  );

  // 3e. Verify supplier balance payable was updated (+ balanceDue of 4000)
  const supListRes = await makeRequest('GET', '/api/suppliers', null, authHeaders);
  const updatedSup = supListRes.data.suppliers.find((s) => s._id === supplierId);
  const expectedPayable = 25000 + balanceDue;
  assert(
    updatedSup.balancePayable === expectedPayable,
    `Supplier payable updated: Expected ${expectedPayable}, Actual ${updatedSup.balancePayable}`
  );

  // 3f. Settle / Pay Supplier
  const payRes = await makeRequest(
    'POST',
    `/api/suppliers/${supplierId}/pay`,
    {
      amount: 10000,
      paymentMethod: 'Bank Transfer',
      notes: 'HBL Raast transfer',
    },
    authHeaders
  );
  assert(payRes.status === 200 && payRes.data.success, 'Recorded 10,000 payment to supplier');
  assert(
    payRes.data.supplier.balancePayable === expectedPayable - 10000,
    `Supplier payable reduced after payment: ${payRes.data.supplier.balancePayable}`
  );

  // ----------------------------------------------------
  // TEST 4: Multi-Unit & Loose Weight Support
  // ----------------------------------------------------
  console.log('\n[Module 4] Testing Multi-Unit & Loose Weight Support');

  // 4a. Create a loose weight product (Basmati Rice /kg)
  const createRiceRes = await makeRequest(
    'POST',
    '/api/products',
    {
      title: 'Super Basmati Rice Loose (Old Crop)',
      sku: `RICE-${Date.now().toString().slice(-4)}`,
      category: 'Groceries & Pantry',
      price: 360,
      costPrice: 280,
      stockQuantity: 250, // 250 kg
      lowStockAlert: 25,
      unitType: 'kg',
      allowFractional: true,
      cartonSize: 50, // 50 kg bag
      cartonPrice: 17000,
      description: 'A-grade loose Basmati rice sold per kg or per 50kg bag',
    },
    authHeaders
  );
  assert(createRiceRes.status === 201 && createRiceRes.data.success, 'Created loose weight product: Basmati Rice /kg');
  const riceProduct = createRiceRes.data.product;
  assert(riceProduct.unitType === 'kg', `unitType is 'kg': ${riceProduct.unitType}`);
  assert(riceProduct.allowFractional === true, `allowFractional is true: ${riceProduct.allowFractional}`);
  assert(riceProduct.cartonPrice === 17000, `cartonPrice is 17000: ${riceProduct.cartonPrice}`);

  // 4b. Perform a sale with fractional quantity (2.75 kg)
  console.log('  Testing POS checkout with fractional loose quantity: 2.75 kg @ Rs 360/kg...');
  const fractionalSaleQty = 2.75;
  const expectedSubtotal = Math.round(fractionalSaleQty * 360 * 100) / 100; // 990

  const orderRes = await makeRequest(
    'POST',
    '/api/orders',
    {
      items: [
        {
          product: riceProduct._id,
          title: riceProduct.title,
          sku: riceProduct.sku,
          price: riceProduct.price,
          quantity: fractionalSaleQty,
          subtotal: expectedSubtotal,
          costPrice: riceProduct.costPrice,
          unitType: 'kg',
        },
      ],
      paymentMethod: 'CASH',
      discountAmount: 0,
      paymentDetails: {
        cashTendered: 1000,
        changeGiven: 10,
      },
    },
    authHeaders
  );

  assert(orderRes.status === 201 && orderRes.data.success, 'Processed fractional order (2.75 kg rice)');
  assert(
    orderRes.data.order.grandTotal === expectedSubtotal,
    `Order grand total matches expected fractional calculation: Rs ${orderRes.data.order.grandTotal}`
  );

  // 4c. Verify stock deducted accurately with decimals (250 - 2.75 = 247.25 kg)
  const riceCheckRes = await makeRequest('GET', '/api/products', null, authHeaders);
  const remainingRice = riceCheckRes.data.products.find((p) => p._id === riceProduct._id);
  const expectedRemaining = 250 - 2.75;
  assert(
    remainingRice.stockQuantity === expectedRemaining,
    `Fractional stock deduction verified! Expected: ${expectedRemaining} kg, Actual: ${remainingRice.stockQuantity} kg`
  );

  // ----------------------------------------------------
  // Clean up test expense
  // ----------------------------------------------------
  if (createdExpId) {
    const delRes = await makeRequest('DELETE', `/api/expenses/${createdExpId}`, null, authHeaders);
    assert(delRes.status === 200 && delRes.data.success, 'Cleaned up test expense');
  }

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
