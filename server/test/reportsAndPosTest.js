/**
 * Integration Test for NaveedPOS Sales Reports, Analytics & POS Enhancements
 */
const memoryStore = require('../src/config/memoryStore');
const reportController = require('../src/controllers/reportController');
const analyticsController = require('../src/controllers/analyticsController');
const productController = require('../src/controllers/productController');

global.useMemoryStore = true;

const runTests = async () => {
  console.log('=== Starting NaveedPOS Sales Reporting & POS Feature Tests ===\n');
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
    };
    return { req, res };
  };

  const storeAdmin = memoryStore.users.find((u) => u.role === 'STORE_ADMIN' && u.tenantId === 'tenant_1');
  assert(!!storeAdmin, 'Store Admin user exists for tenant_1');

  // TEST 1: Daily Sales Report (GET /api/reports/sales?period=today)
  console.log('\n1. Testing Daily Sales Report (/api/reports/sales?period=today)...');
  const todayReqRes = createMockReqRes({}, storeAdmin, {}, { period: 'today' });
  await reportController.getSalesReport(todayReqRes.req, todayReqRes.res, (err) => console.error(err));

  assert(todayReqRes.res.statusCode === 200, 'Daily sales report returned HTTP 200');
  assert(todayReqRes.res.jsonData.success === true, 'Success flag is true');
  assert(typeof todayReqRes.res.jsonData.metrics.totalSales === 'number', 'Gross Sales metric computed');
  assert(typeof todayReqRes.res.jsonData.metrics.totalCost === 'number', 'Total Cost metric computed');
  assert(typeof todayReqRes.res.jsonData.metrics.totalProfit === 'number', 'Net Profit metric computed');
  assert(typeof todayReqRes.res.jsonData.metrics.profitMargin === 'number', 'Profit Margin % metric computed');
  assert(typeof todayReqRes.res.jsonData.metrics.orderCount === 'number', 'Orders count computed');
  assert(typeof todayReqRes.res.jsonData.metrics.averageOrderValue === 'number', 'AOV computed');
  assert(Array.isArray(todayReqRes.res.jsonData.paymentBreakdown), 'Payment methods breakdown returned');
  assert(Array.isArray(todayReqRes.res.jsonData.salesTrend), 'Daily sales trend timeseries returned');
  assert(Array.isArray(todayReqRes.res.jsonData.orders), 'Itemized orders list returned');

  // TEST 2: Weekly Sales Report (GET /api/reports/sales?period=weekly)
  console.log('\n2. Testing Weekly Sales Report (/api/reports/sales?period=weekly)...');
  const weekReqRes = createMockReqRes({}, storeAdmin, {}, { period: 'weekly' });
  await reportController.getSalesReport(weekReqRes.req, weekReqRes.res, (err) => console.error(err));

  assert(weekReqRes.res.statusCode === 200, 'Weekly sales report returned HTTP 200');
  assert(weekReqRes.res.jsonData.salesTrend.length === 7, 'Weekly trend has exactly 7 daily data points');

  // TEST 3: Monthly & Custom Date Range Report
  console.log('\n3. Testing Custom Date Range Report (/api/reports/sales?period=custom)...');
  const customReqRes = createMockReqRes(
    {},
    storeAdmin,
    {},
    { period: 'custom', startDate: '2026-11-01', endDate: '2026-11-07' }
  );
  await reportController.getSalesReport(customReqRes.req, customReqRes.res, (err) => console.error(err));

  assert(customReqRes.res.statusCode === 200, 'Custom range report returned HTTP 200');
  assert(customReqRes.res.jsonData.filter.period === 'custom', 'Period identified as custom');

  // TEST 4: Enhanced Dashboard Stats (/api/analytics/dashboard)
  console.log('\n4. Testing Enhanced Dashboard Analytics (/api/analytics/dashboard)...');
  const dashReqRes = createMockReqRes({}, storeAdmin);
  await analyticsController.getDashboardStats(dashReqRes.req, dashReqRes.res, (err) => console.error(err));

  assert(dashReqRes.res.statusCode === 200, 'Dashboard stats returned HTTP 200');
  assert(typeof dashReqRes.res.jsonData.summary.todayRevenue === 'number', 'Today revenue present');
  assert(typeof dashReqRes.res.jsonData.summary.todayProfit === 'number', 'Estimated daily profit computed');
  assert(typeof dashReqRes.res.jsonData.summary.revenueGrowthPercent === 'number', 'Revenue growth % computed');
  assert(dashReqRes.res.jsonData.topSellingProducts.length > 0, 'Top selling products ranked');

  const topProduct = dashReqRes.res.jsonData.topSellingProducts[0];
  assert(!!topProduct.title, 'Top product title present');
  assert(!!topProduct.image, 'Top product image present');
  assert(typeof topProduct.totalUnitsSold === 'number', 'Top product units sold tracked');

  // TEST 5: POS Quick Add Product (/api/products)
  console.log('\n5. Testing POS Quick Product Creation (/api/products)...');
  const addProdReqRes = createMockReqRes(
    {
      title: 'Premium Pistachio Biscotti 200g',
      sku: 'BIS-990',
      category: 'Snacks & Bakery',
      price: 490,
      costPrice: 280,
      stockQuantity: 15,
      lowStockAlert: 5,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop',
    },
    storeAdmin
  );

  await productController.createProduct(addProdReqRes.req, addProdReqRes.res, (err) => console.error(err));
  assert(addProdReqRes.res.statusCode === 201, 'Quick add product returned HTTP 201 Created');
  assert(addProdReqRes.res.jsonData.product.sku === 'BIS-990', 'Product SKU saved correctly');
  assert(addProdReqRes.res.jsonData.product.stockQuantity === 15, 'Stock quantity configured correctly');

  console.log(`\n=== Integration Test Complete: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
};

runTests();
