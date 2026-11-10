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
  console.log('=== Starting NaveedPOS Detailed Sales & Profit Reports Tests ===\n');

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

  // 2. Test Daily Detailed Sales Report
  console.log('\n2. Testing Daily Detailed Sales Report (/api/reports/detailed-sales?period=daily)...');
  const dailyRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/detailed-sales?period=daily',
    token,
  });

  assert(dailyRes.status === 200, 'Daily detailed sales returned HTTP 200');
  assert(dailyRes.body.success === true, 'Response success is true');
  assert(dailyRes.body.period === 'daily', 'Period is daily');
  assert(dailyRes.body.periodLabel === 'Today', 'Period label is Today');
  assert(typeof dailyRes.body.summary.grossTurnover === 'number', 'Gross turnover metric computed');
  assert(typeof dailyRes.body.summary.cogs === 'number', 'COGS wholesale acquisition cost computed');
  assert(typeof dailyRes.body.summary.netProfit === 'number', 'Net profit metric computed');
  assert(typeof dailyRes.body.summary.netProfitMargin === 'number', 'Net profit margin % computed');
  assert(typeof dailyRes.body.summary.orderCount === 'number', 'Orders count computed');
  assert(typeof dailyRes.body.summary.averageOrderValue === 'number', 'Average Order Value computed');
  assert(Array.isArray(dailyRes.body.paymentSplits), 'Payment splits returned as array');
  assert(dailyRes.body.paymentSplits.some((p) => p.method === 'CASH'), 'Cash payment split included');
  assert(dailyRes.body.paymentSplits.some((p) => p.method === 'CARD'), 'Card payment split included');
  assert(dailyRes.body.paymentSplits.some((p) => p.method === 'KHATA'), 'Khata payment split included');

  // Verify Line-Item Data Table Rows
  assert(Array.isArray(dailyRes.body.orders), 'Orders returned as line-item array');
  assert(dailyRes.body.orders.length > 0, 'Line-item records found for today');
  const firstOrder = dailyRes.body.orders[0];
  assert(!!firstOrder.orderNumber, 'Order number / receipt no present');
  assert(!!firstOrder.itemsSoldSummary, 'Items sold summary string present');
  assert(typeof firstOrder.totalQuantity === 'number', 'Total quantity present');
  assert(typeof firstOrder.cogs === 'number', 'Order COGS present');
  assert(typeof firstOrder.grossSellingPrice === 'number', 'Order gross selling price present');
  assert(typeof firstOrder.netTurnover === 'number', 'Order net turnover present');
  assert(typeof firstOrder.netProfit === 'number', 'Order net profit present');
  assert(typeof firstOrder.margin === 'number', 'Order margin % present');

  const dailyTurnover = dailyRes.body.summary.grossTurnover;
  const dailyOrders = dailyRes.body.summary.orderCount;
  console.log(`   -> Daily: Rs. ${dailyTurnover} across ${dailyOrders} orders`);

  // 3. Test Weekly Detailed Sales Report
  console.log('\n3. Testing Weekly Detailed Sales Report (/api/reports/detailed-sales?period=weekly)...');
  const weeklyRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/detailed-sales?period=weekly',
    token,
  });

  assert(weeklyRes.status === 200, 'Weekly detailed sales returned HTTP 200');
  assert(weeklyRes.body.period === 'weekly', 'Period is weekly');
  assert(weeklyRes.body.periodLabel === 'This Week', 'Period label is This Week');

  const weeklyTurnover = weeklyRes.body.summary.grossTurnover;
  const weeklyOrders = weeklyRes.body.summary.orderCount;
  assert(weeklyTurnover >= dailyTurnover, `Weekly turnover (Rs. ${weeklyTurnover}) >= Daily turnover (Rs. ${dailyTurnover})`);
  assert(weeklyOrders >= dailyOrders, `Weekly orders (${weeklyOrders}) >= Daily orders (${dailyOrders})`);
  console.log(`   -> Weekly: Rs. ${weeklyTurnover} across ${weeklyOrders} orders`);

  // 4. Test Monthly Detailed Sales Report
  console.log('\n4. Testing Monthly Detailed Sales Report (/api/reports/detailed-sales?period=monthly)...');
  const monthlyRes = await makeRequest({
    method: 'GET',
    path: '/api/reports/detailed-sales?period=monthly',
    token,
  });

  assert(monthlyRes.status === 200, 'Monthly detailed sales returned HTTP 200');
  assert(monthlyRes.body.period === 'monthly', 'Period is monthly');
  assert(monthlyRes.body.periodLabel === 'This Month', 'Period label is This Month');

  const monthlyTurnover = monthlyRes.body.summary.grossTurnover;
  const monthlyOrders = monthlyRes.body.summary.orderCount;
  assert(monthlyTurnover >= weeklyTurnover, `Monthly turnover (Rs. ${monthlyTurnover}) >= Weekly turnover (Rs. ${weeklyTurnover})`);
  assert(monthlyOrders >= weeklyOrders, `Monthly orders (${monthlyOrders}) >= Weekly orders (${weeklyOrders})`);
  console.log(`   -> Monthly: Rs. ${monthlyTurnover} across ${monthlyOrders} orders`);

  // 5. Test Custom Range Detailed Sales Report
  console.log('\n5. Testing Custom Range Detailed Sales Report (/api/reports/detailed-sales?period=custom)...');
  const customStart = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10);
  const customEnd = new Date().toISOString().slice(0, 10);

  const customRes = await makeRequest({
    method: 'GET',
    path: `/api/reports/detailed-sales?period=custom&startDate=${customStart}&endDate=${customEnd}`,
    token,
  });

  assert(customRes.status === 200, 'Custom range detailed sales returned HTTP 200');
  assert(customRes.body.period === 'custom', 'Period is custom');
  assert(customRes.body.periodLabel === 'Custom Range', 'Period label is Custom Range');
  assert(customRes.body.summary.grossTurnover > 0, 'Custom period gross turnover > 0');

  console.log('\n=== Detailed Sales & Net Profit Reports: ALL 30 TESTS PASSED ===\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
