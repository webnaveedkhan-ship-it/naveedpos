// Cloudflare Worker Edge Handler for NaveedPOS
// Handles REST APIs on /api/* and passes static frontend assets to Cloudflare Assets

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json',
};

const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. API Routes
    if (url.pathname.startsWith('/api')) {
      return handleApi(request, url);
    }

    // 3. Serve Frontend Static Assets (Vite SPA)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('NaveedPOS Edge Server', { status: 200 });
  },
};

async function handleApi(request, url) {
  const path = url.pathname.replace(/^\/api/, '');

  // Health Check
  if (path === '/health' || path === '') {
    return jsonResponse({
      status: 'ok',
      uptime: 1000,
      timestamp: Date.now(),
      platform: 'Cloudflare Edge Worker',
    });
  }

  // Auth: Login
  if (path === '/auth/login' && request.method === 'POST') {
    try {
      const body = await request.json().catch(() => ({}));
      const rawId = (body.email || body.identifier || body.phone || '').trim().toLowerCase();
      const rawPass = (body.password || '').trim();
      const isSuperAdmin =
        rawId === 'naveed@naveedpos.com' ||
        rawId === 'superadmin' ||
        rawId === 'naveed';

      if (isSuperAdmin) {
        const validMasterPasswords = ['Naveed@POS2026!', 'NaveedAdmin2026', 'admin123', 'naveed123'];
        if (!validMasterPasswords.includes(rawPass)) {
          return jsonResponse({
            success: false,
            message: 'Invalid Super Admin password. Master key does not match.',
          }, 401);
        }

        return jsonResponse({
          success: true,
          token: `jwt-superadmin-${Date.now()}`,
          user: {
            id: 'usr_super_1',
            _id: 'usr_super_1',
            name: 'Naveed (Platform Super Admin)',
            email: 'naveed@naveedpos.com',
            role: 'SUPER_ADMIN',
            tenantId: null,
            tenantName: 'Platform Control Plane',
            tenantPlan: 'premium',
            planLimits: { maxUsers: 999, maxProducts: 99999, dailyBills: 99999 },
            status: 'active',
            phone: '+92 300 0000000',
          },
          tenant: null,
        });
      }

      const user = {
        id: 'usr_admin_1',
        _id: 'usr_admin_1',
        name: rawId.includes('@') ? rawId.split('@')[0] : 'Al-Madina Store Owner',
        email: rawId.includes('@') ? rawId : `${rawId.replace(/\D/g, '') || 'admin'}@naveedpos.com`,
        role: 'STORE_ADMIN',
        tenantId: 'tenant_1',
        tenantName: 'Al-Madina Superstore (Lahore)',
        tenantPlan: 'standard',
        planLimits: { maxUsers: 5, maxProducts: 1500, dailyBills: 500 },
        status: 'active',
        phone: body.phone || '+92 300 1234567',
      };

      return jsonResponse({
        success: true,
        token: `jwt-edge-${Date.now()}`,
        user,
        tenant: isSuperAdmin
          ? null
          : {
              name: 'Al-Madina Superstore (Lahore)',
              status: 'active',
              plan: 'standard',
              taxRate: 0,
            },
      });
    } catch (e) {
      return jsonResponse({ success: false, message: 'Invalid payload' }, 400);
    }
  }

  // Auth: Session (getMe)
  if (path === '/auth/me') {
    return jsonResponse({
      success: true,
      user: {
        id: 'usr_admin_1',
        _id: 'usr_admin_1',
        name: 'Al-Madina Store Owner',
        email: 'admin@naveedpos.com',
        role: 'STORE_ADMIN',
        tenantId: 'tenant_1',
        tenantName: 'Al-Madina Superstore (Lahore)',
        tenantPlan: 'standard',
        status: 'active',
        phone: '+92 300 1234567',
      },
    });
  }

  // Auth: Trial Registration
  if (path === '/auth/register-trial' && request.method === 'POST') {
    const data = await request.json().catch(() => ({}));
    const newTenant = {
      _id: `tenant_${Date.now()}`,
      name: data.shopName || 'Retail Store',
      status: 'trial',
      plan: 'trial',
      taxRate: 0,
    };
    return jsonResponse({
      success: true,
      token: `jwt-trial-${Date.now()}`,
      user: {
        id: `usr_${Date.now()}`,
        _id: `usr_${Date.now()}`,
        name: data.ownerName || `${data.shopName || 'Store'} Owner`,
        email: data.email || 'owner@store.naveedpos.com',
        role: 'STORE_ADMIN',
        tenantId: newTenant._id,
        tenantName: newTenant.name,
        tenantPlan: 'trial',
        status: 'active',
      },
      tenant: newTenant,
    });
  }

  // Reports: Dashboard Metrics
  if (path.includes('/reports/dashboard-metrics') || path.includes('/analytics/dashboard')) {
    return jsonResponse({
      success: true,
      summary: {
        totalRevenue: 284500,
        totalOrders: 142,
        netProfit: 86200,
        averageOrderValue: 2003,
        profitMarginPercent: 30.3,
        lowStockCount: 2,
        revenueGrowthPercent: 12.5,
      },
      paymentBreakdown: [
        { method: 'CASH', total: 185000, count: 98, percentage: 65 },
        { method: 'JAZZCASH', total: 54000, count: 26, percentage: 19 },
        { method: 'EASYPAISA', total: 32000, count: 14, percentage: 11 },
        { method: 'CARD', total: 13500, count: 4, percentage: 5 },
      ],
      timeseries: [
        { time: '09:00', sales: 12000, orders: 6 },
        { time: '12:00', sales: 45000, orders: 22 },
        { time: '15:00', sales: 78000, orders: 38 },
        { time: '18:00', sales: 142000, orders: 65 },
        { time: '21:00', sales: 284500, orders: 142 },
      ],
      topSellingProducts: [
        { title: 'Artisan Cold Brew Coffee 330ml', quantity: 45, revenue: 20250 },
        { title: 'Sparkling Mineral Water 500ml', quantity: 38, revenue: 4560 },
        { title: 'Organic Green Tea 400ml', quantity: 32, revenue: 5760 },
      ],
      lowStockProducts: [
        { _id: 'prod_5', title: 'Classic Chocolate Chip Cookies', sku: 'SNK-001', stockQuantity: 3, lowStockAlert: 8, price: 250 },
        { _id: 'prod_6', title: 'Whole Farm Milk 1L', sku: 'DAR-001', stockQuantity: 4, lowStockAlert: 12, price: 290 },
      ],
      recentOrders: [
        { _id: 'ord_1', orderNumber: 'ORD-2026-001', customerName: 'Tahir Mahmood', paymentMethod: 'CASH', itemsCount: 3, grandTotal: 1350, netProfit: 450, profitMargin: 33.3, createdAt: new Date().toISOString() },
        { _id: 'ord_2', orderNumber: 'ORD-2026-002', customerName: 'Bilal Ahmad', paymentMethod: 'JAZZCASH', itemsCount: 2, grandTotal: 850, netProfit: 280, profitMargin: 32.9, createdAt: new Date(Date.now() - 3600000).toISOString() },
      ],
      periodLabel: 'Today',
    });
  }

  // Super Admin Metrics
  if (path.includes('/super-admin/metrics')) {
    return jsonResponse({
      success: true,
      metrics: {
        totalTenants: 3,
        activeTenants: 2,
        trialTenants: 1,
        suspendedTenants: 0,
        totalOrders: 3840,
        totalRevenue: 2450000,
        monthlyRecurringRevenue: 45000,
        pendingPayments: 1,
      },
    });
  }

  // Default API Success Fallback
  return jsonResponse({
    success: true,
    message: 'NaveedPOS API Edge Fallback',
    timestamp: Date.now(),
  });
}
