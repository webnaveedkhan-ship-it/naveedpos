const http = require('http');
const memoryStore = require('../src/config/memoryStore');

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
  console.log('=== Starting NaveedPOS Multi-Period Synchronized Dashboard Tests ===\n');

  // 1. Authenticate Store Admin
  console.log('1. Authenticating Store Admin (Al-Madina / tenant_1)...');
  const loginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'admin@naveedpos.com',
      password: 'admin123',
    },
  });

  assert(loginRes.status === 200, 'Login status is 200');
  assert(loginRes.body.success === true, 'Login successful');
  const token = loginRes.body.token;
  assert(!!token, 'Auth JWT token received');

  // 2. Test "Today" (Daily) Synchronized Metrics
  console.log('\n2. Testing "Today" (Daily) Synchronized Dashboard Metrics (/api/reports/dashboard-metrics?period=today)...');
  const todayRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/dashboard-metrics?period=today',
    token,
  });

  assert(todayRes.status === 200, 'Today metrics returned HTTP 200');
  assert(todayRes.body.success === true, 'Response success is true');
  assert(todayRes.body.period === 'today', 'Period identifier is today');
  assert(todayRes.body.periodLabel === 'Today', 'Period label is Today');
  assert(typeof todayRes.body.summary.totalSales === 'number', 'Summary contains totalSales');
  assert(typeof todayRes.body.summary.netProfit === 'number', 'Summary contains netProfit');
  assert(typeof todayRes.body.summary.profitMargin === 'number', 'Summary contains profitMargin');
  assert(typeof todayRes.body.summary.orderCount === 'number', 'Summary contains orderCount');
  assert(typeof todayRes.body.summary.averageOrderValue === 'number', 'Summary contains AOV');
  assert(typeof todayRes.body.summary.khataUdharGiven === 'number', 'Summary contains khataUdharGiven');
  assert(typeof todayRes.body.summary.cashCollected === 'number', 'Summary contains cashCollected');
  assert(typeof todayRes.body.summary.cardCollected === 'number', 'Summary contains cardCollected');

  // Timeseries must be hourly for today
  assert(Array.isArray(todayRes.body.timeseries), 'Timeseries is an array');
  assert(todayRes.body.timeseries.length > 0, 'Timeseries has hourly slots');
  assert(todayRes.body.timeseries[0].label.includes('AM') || todayRes.body.timeseries[0].label.includes('PM'), 'Hourly slot format is correct');

  // Top products strictly for today
  assert(Array.isArray(todayRes.body.topSellingProducts), 'Top selling products returned as array');
  assert(Array.isArray(todayRes.body.recentOrders), 'Recent orders returned as array');

  const todaySales = todayRes.body.summary.totalSales;
  const todayOrdersCount = todayRes.body.summary.orderCount;
  console.log(`   -> Today: Rs. ${todaySales} across ${todayOrdersCount} orders`);

  // 3. Test "This Week" (Weekly) Synchronized Metrics
  console.log('\n3. Testing "This Week" Synchronized Dashboard Metrics (/api/reports/dashboard-metrics?period=this_week)...');
  const weekRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/dashboard-metrics?period=this_week',
    token,
  });

  assert(weekRes.status === 200, 'This Week metrics returned HTTP 200');
  assert(weekRes.body.period === 'this_week', 'Period identifier is this_week');
  assert(weekRes.body.periodLabel === 'This Week', 'Period label is This Week');

  // Timeseries for week must be 7 days (Mon through Sun)
  assert(weekRes.body.timeseries.length === 7, 'Weekly timeseries has exactly 7 days');
  assert(weekRes.body.timeseries[0].label === 'Mon', 'First day in weekly chart is Monday');
  assert(weekRes.body.timeseries[6].label === 'Sun', 'Last day in weekly chart is Sunday');

  const weekSales = weekRes.body.summary.totalSales;
  const weekOrdersCount = weekRes.body.summary.orderCount;
  assert(weekSales >= todaySales, `Weekly sales (Rs. ${weekSales}) >= Today's sales (Rs. ${todaySales})`);
  assert(weekOrdersCount >= todayOrdersCount, `Weekly orders count (${weekOrdersCount}) >= Today's orders count (${todayOrdersCount})`);
  console.log(`   -> This Week: Rs. ${weekSales} across ${weekOrdersCount} orders`);

  // 4. Test "This Month" (Monthly) Synchronized Metrics
  console.log('\n4. Testing "This Month" Synchronized Dashboard Metrics (/api/reports/dashboard-metrics?period=this_month)...');
  const monthRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/dashboard-metrics?period=this_month',
    token,
  });

  assert(monthRes.status === 200, 'This Month metrics returned HTTP 200');
  assert(monthRes.body.period === 'this_month', 'Period identifier is this_month');
  assert(monthRes.body.periodLabel === 'This Month', 'Period label is This Month');

  const monthSales = monthRes.body.summary.totalSales;
  const monthOrdersCount = monthRes.body.summary.orderCount;
  assert(monthSales >= weekSales, `Monthly sales (Rs. ${monthSales}) >= Weekly sales (Rs. ${weekSales})`);
  assert(monthOrdersCount >= weekOrdersCount, `Monthly orders count (${monthOrdersCount}) >= Weekly orders count (${weekOrdersCount})`);
  console.log(`   -> This Month: Rs. ${monthSales} across ${monthOrdersCount} orders`);

  // 5. Test "Custom Range" Synchronized Metrics
  console.log('\n5. Testing "Custom Range" Synchronized Dashboard Metrics (/api/reports/dashboard-metrics?period=custom)...');
  const customStart = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const customEnd = new Date().toISOString().slice(0, 10);

  const customRes = await makeRequest({
    method: 'GET',
    path: `/api/reports/dashboard-metrics?period=custom&startDate=${customStart}&endDate=${customEnd}`,
    token,
  });

  assert(customRes.status === 200, 'Custom Range metrics returned HTTP 200');
  assert(customRes.body.period === 'custom', 'Period identifier is custom');
  assert(customRes.body.periodLabel === 'Custom Range', 'Period label is Custom Range');
  assert(customRes.body.summary.totalSales > 0, 'Custom period total sales > 0');

  // 6. Test Analytics Endpoint Backward Compatibility
  console.log('\n6. Testing /api/analytics/dashboard?period=weekly Compatibility...');
  const analyticsRes = await makeRequest({
    method: 'GET',
    path: '/api/analytics/dashboard?period=weekly',
    token,
  });

  assert(analyticsRes.status === 200, 'Analytics dashboard with period query returned HTTP 200');
  assert(analyticsRes.body.period === 'this_week', 'Analytics dashboard normalized period to this_week');
  assert(analyticsRes.body.summary.totalSales === weekSales, 'Consistent weekly figures across endpoints');

  console.log('\n=== Synchronized Multi-Period Dashboard Engine: ALL 32 TESTS PASSED ===\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
