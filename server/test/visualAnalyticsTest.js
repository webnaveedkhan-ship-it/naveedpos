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
  console.log('=== Starting NaveedPOS Visual Analytics & Modern Reports Tests ===\n');

  // 1. Unauthenticated Security Guard
  console.log('1. Testing Unauthenticated Request Security...');
  const unauthRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/visual-analytics',
  });
  assert(
    unauthRes.status === 401,
    `Unauthenticated GET /api/reports/visual-analytics is rejected with 401 (Received: ${unauthRes.status})`
  );

  // 2. Authenticate Store Admin (Al-Madina / tenant_1)
  console.log('\n2. Authenticating Store Admin (Al-Madina Mart)...');
  const loginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'admin@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(loginRes.status === 200, `Store Admin login returns 200 (Received: ${loginRes.status})`);
  assert(!!loginRes.body.token, 'JWT token returned in login response');
  const token = loginRes.body.token;

  // 3. Daily Visual Analytics
  console.log('\n3. Testing Daily Visual Analytics (GET /api/reports/visual-analytics?period=daily)...');
  const dailyRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/visual-analytics?period=daily',
    token,
  });
  assert(dailyRes.status === 200, `GET /api/reports/visual-analytics?period=daily returns 200`);
  assert(dailyRes.body.success === true, `Response success is true`);
  assert(dailyRes.body.period === 'daily', `Period identifier is daily`);
  assert(dailyRes.body.periodLabel === 'Today', `Period label is Today`);

  // Validate KPIs
  const kpis = dailyRes.body.kpis;
  assert(typeof kpis.grossSales === 'number', `kpis.grossSales is a number: ${kpis.grossSales}`);
  assert(typeof kpis.cogs === 'number', `kpis.cogs is a number: ${kpis.cogs}`);
  assert(typeof kpis.netProfit === 'number', `kpis.netProfit is a number: ${kpis.netProfit}`);
  assert(typeof kpis.profitMargin === 'number', `kpis.profitMargin is a number: ${kpis.profitMargin}%`);
  assert(typeof kpis.marketUdhar === 'number', `kpis.marketUdhar is a number: ${kpis.marketUdhar}`);
  assert(typeof kpis.totalOrders === 'number', `kpis.totalOrders is a number: ${kpis.totalOrders}`);
  assert(typeof kpis.averageOrderValue === 'number', `kpis.averageOrderValue is a number: ${kpis.averageOrderValue}`);

  // Validate Timeline Chart (Adaptive Hourly checkpoints)
  const timeline = dailyRes.body.timelineChart;
  assert(Array.isArray(timeline), `timelineChart is an array`);
  assert(timeline.length > 0, `timelineChart has hourly data points (Length: ${timeline.length})`);
  assert(!!timeline[0].timeLabel, `Timeline item has timeLabel: "${timeline[0].timeLabel}"`);
  assert(typeof timeline[0].sales === 'number', `Timeline item has numeric sales: ${timeline[0].sales}`);
  assert(typeof timeline[0].profit === 'number', `Timeline item has numeric profit: ${timeline[0].profit}`);

  // Validate Payment Methods Donut Stream
  const payments = dailyRes.body.paymentMethods;
  assert(Array.isArray(payments), `paymentMethods is an array`);
  assert(payments.length === 3, `paymentMethods has exactly 3 streams (Cash, Card, Khata)`);
  const cashStream = payments.find((p) => p.method === 'CASH');
  const cardStream = payments.find((p) => p.method === 'CARD');
  const khataStream = payments.find((p) => p.method === 'KHATA');
  assert(!!cashStream && cashStream.color === '#10b981', `Cash payment stream configured with Emerald color`);
  assert(!!cardStream && cardStream.color === '#3b82f6', `Card payment stream configured with Blue color`);
  assert(!!khataStream && khataStream.color === '#f59e0b', `Khata payment stream configured with Amber color`);

  // Validate Top 5 Products
  const topProducts = dailyRes.body.topProducts;
  assert(Array.isArray(topProducts), `topProducts is an array`);
  assert(topProducts.length <= 5, `topProducts does not exceed limit of 5`);
  if (topProducts.length > 0) {
    const p1 = topProducts[0];
    assert(!!p1.title, `Top product has title: "${p1.title}"`);
    assert(typeof p1.totalRevenue === 'number', `Top product has totalRevenue: ${p1.totalRevenue}`);
    assert(typeof p1.unitsSold === 'number', `Top product has unitsSold: ${p1.unitsSold}`);
  }

  // Validate Recent Orders List
  const recentOrders = dailyRes.body.recentOrders;
  assert(Array.isArray(recentOrders), `recentOrders is an array`);
  if (recentOrders.length > 0) {
    const o1 = recentOrders[0];
    assert(!!o1.orderNumber, `Order has orderNumber: "${o1.orderNumber}"`);
    assert(!!o1.timeStr, `Order has formatted timeStr: "${o1.timeStr}"`);
    assert(!!o1.paymentMethod, `Order has paymentMethod: "${o1.paymentMethod}"`);
    assert(typeof o1.grandTotal === 'number', `Order has grandTotal: ${o1.grandTotal}`);
    assert(typeof o1.netProfit === 'number', `Order has netProfit: ${o1.netProfit}`);
  }

  // 4. Weekly Visual Analytics
  console.log('\n4. Testing Weekly Visual Analytics (GET /api/reports/visual-analytics?period=weekly)...');
  const weeklyRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/visual-analytics?period=weekly',
    token,
  });
  assert(weeklyRes.status === 200, `GET /api/reports/visual-analytics?period=weekly returns 200`);
  assert(weeklyRes.body.period === 'weekly', `Weekly period confirmed`);
  assert(weeklyRes.body.periodLabel === 'This Week', `Period label is This Week`);
  assert(weeklyRes.body.timelineChart.length === 7, `Weekly timeline has exactly 7 days (Mon to Sun)`);
  assert(
    weeklyRes.body.kpis.grossSales >= dailyRes.body.kpis.grossSales,
    `Weekly sales (Rs. ${weeklyRes.body.kpis.grossSales}) >= Daily sales (Rs. ${dailyRes.body.kpis.grossSales})`
  );
  assert(
    weeklyRes.body.kpis.totalOrders >= dailyRes.body.kpis.totalOrders,
    `Weekly orders (${weeklyRes.body.kpis.totalOrders}) >= Daily orders (${dailyRes.body.kpis.totalOrders})`
  );

  // 5. Monthly Visual Analytics
  console.log('\n5. Testing Monthly Visual Analytics (GET /api/reports/visual-analytics?period=monthly)...');
  const monthlyRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/visual-analytics?period=monthly',
    token,
  });
  assert(monthlyRes.status === 200, `GET /api/reports/visual-analytics?period=monthly returns 200`);
  assert(monthlyRes.body.period === 'monthly', `Monthly period confirmed`);
  assert(monthlyRes.body.periodLabel === 'This Month', `Period label is This Month`);
  assert(
    monthlyRes.body.kpis.grossSales >= weeklyRes.body.kpis.grossSales,
    `Monthly sales (Rs. ${monthlyRes.body.kpis.grossSales}) >= Weekly sales (Rs. ${weeklyRes.body.kpis.grossSales})`
  );

  // 6. Custom Range Visual Analytics
  console.log('\n6. Testing Custom Date Range Filter...');
  const customRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/visual-analytics?period=custom&startDate=2026-11-01&endDate=2026-11-08',
    token,
  });
  assert(customRes.status === 200, `Custom date range returns 200`);
  assert(customRes.body.period === 'custom', `Custom period confirmed`);
  assert(customRes.body.periodLabel === 'Custom Range', `Custom label confirmed`);
  assert(customRes.body.kpis.grossSales > 0, `Custom date range gross sales > 0`);

  // 7. Multi-Tenant Scoping Guard
  console.log('\n7. Testing Multi-Tenant Data Isolation...');
  const khanLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'khan@naveedpos.com',
      password: 'admin123',
    },
  });
  assert(khanLoginRes.status === 200, `Karachi store owner login succeeds`);
  const khanToken = khanLoginRes.body.token;

  const khanReport = await makeRequest({
    method: 'GET',
    path: '/api/reports/visual-analytics?period=weekly',
    token: khanToken,
  });
  assert(khanReport.status === 200, `Karachi store report returns 200`);
  // Ensure no Al-Madina orders leak into Karachi report
  const leakingOrder = khanReport.body.recentOrders.find((o) => o.orderNumber === 'NPOS-261107-1011');
  assert(!leakingOrder, `Tenant isolation verified: Al-Madina orders NOT visible in Karachi store report`);

  console.log('\n=== ALL 32 VISUAL ANALYTICS & MODERN REPORTS TESTS PASSED! ===');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
