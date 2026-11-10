import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 errors for auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register-trial')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  identifyStore: (identifier) => api.post('/auth/identify-store', { identifier }),
  register: (userData) => api.post('/auth/register', userData),
  registerTrial: (data) => api.post('/auth/register-trial', data),
  impersonate: (tenantId) => api.post(`/auth/impersonate/${tenantId}`),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Customer Khata Endpoints (Udhar Ledger)
export const khataService = {
  getMetrics: () => api.get('/khata/metrics'),
  getCustomers: (params) => api.get('/khata/customers', { params }),
  getCustomerById: (id) => api.get(`/khata/customers/${id}`),
  createCustomer: (data) => api.post('/khata/customers', data),
  recordPayment: (id, paymentData) => api.post(`/khata/customers/${id}/payment`, paymentData),
};

// Super Admin & Store Admin Billing SaaS Endpoints
export const superAdminService = {
  getMetrics: () => api.get('/super-admin/metrics'),
  getStats: () => api.get('/super-admin/stats'),
  getTenants: (params) => api.get('/super-admin/tenants', { params }),
  createTenant: (data) => api.post('/super-admin/tenants', data),
  updateTenantPlan: (id, planData) => api.put(`/super-admin/tenants/${id}/plan`, planData),
  quickExtend: (id, days) => api.put(`/super-admin/tenants/${id}/extend`, { days }),
  toggleStatus: (id, status) => api.put(`/super-admin/tenants/${id}/status`, { status }),
  impersonate: (id) => api.post(`/super-admin/tenants/${id}/impersonate`),
  purgeTenantData: (id, data) => api.post(`/super-admin/tenants/${id}/purge-data`, data),
  deleteTenant: (id) => api.delete(`/super-admin/tenants/${id}`),

  getPayments: (params) => api.get('/super-admin/payments', { params }),
  approvePayment: (id) => api.put(`/super-admin/payments/${id}/approve`),
  rejectPayment: (id, reason) => api.put(`/super-admin/payments/${id}/reject`, { reason }),
  reviewPayment: (id, data) => api.patch(`/super-admin/payments/${id}/review`, data),

  getBroadcasts: () => api.get('/super-admin/broadcast'),
  createBroadcast: (data) => api.post('/super-admin/broadcast', data),
  deleteBroadcast: (id) => api.delete(`/super-admin/broadcast/${id}`),

  getAuditLogs: (params) => api.get('/super-admin/audit', { params }),
};

export const broadcastService = {
  getActive: () => api.get('/broadcast/active'),
};

export const tenantService = {
  // Super Admin Control Plane (aliases for backward compatibility)
  getPlatformStats: () => api.get('/super-admin/metrics'),
  getTenants: (params) => api.get('/super-admin/tenants', { params }),
  createTenant: (data) => api.post('/super-admin/tenants', data),
  toggleTenantStatus: (id, status) => api.put(`/super-admin/tenants/${id}/status`, { status }),
  extendSubscription: (id, days) => api.put(`/super-admin/tenants/${id}/extend`, { days }),
  updateTenantPlan: (id, planData) => api.put(`/super-admin/tenants/${id}/plan`, planData),
  deleteTenant: (id) => api.delete(`/super-admin/tenants/${id}`),

  // Subscription Payment Approvals (Super Admin)
  getPayments: (params) => api.get('/super-admin/payments', { params }),
  approvePayment: (id) => api.put(`/super-admin/payments/${id}/approve`),
  rejectPayment: (id, reason) => api.put(`/super-admin/payments/${id}/reject`, { reason }),

  // Store Admin Billing & Renewal Self-Service
  getMyBilling: () => api.get('/tenants/billing'),
  submitPayment: (data) => api.post('/tenants/billing/payment', data),
};

// Product Endpoints
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getLowStockProducts: () => api.get('/products/low-stock'),
  quickRestock: (id, data) => api.patch(`/products/${id}/restock`, data),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductBySku: (sku) => api.get(`/products/sku/${sku}`),
  createProduct: (formData) =>
    api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateProduct: (id, formData) =>
    api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/meta/categories'),
};

// Order Endpoints
export const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
};

// Analytics & Reporting Endpoints
export const analyticsService = {
  getDashboardStats: (params) => api.get('/analytics/dashboard', { params }),
  getDashboardMetrics: (params) => api.get('/reports/dashboard-metrics', { params }),
};

export const reportService = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getDashboardMetrics: (params) => api.get('/reports/dashboard-metrics', { params }),
  getDetailedSalesReport: (params) => api.get('/reports/detailed-sales', { params }),
  getVisualAnalytics: (params) => api.get('/reports/visual-analytics', { params }),
};

// User / Staff Endpoints
export const userService = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Expense Endpoints
export const expenseService = {
  getExpenses: (params) => api.get('/expenses', { params }),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

// Supplier Endpoints
export const supplierService = {
  getSuppliers: (params) => api.get('/suppliers', { params }),
  createSupplier: (supplierData) => api.post('/suppliers', supplierData),
  paySupplier: (id, paymentData) => api.post(`/suppliers/${id}/pay`, paymentData),
};

// Purchase / Inward Stock Endpoints
export const purchaseService = {
  getPurchases: (params) => api.get('/purchases', { params }),
  createPurchase: (purchaseData) => api.post('/purchases', purchaseData),
};

// Cash Drawer Reconciliation Endpoints (Sham ka Hisaab)
export const cashDrawerService = {
  getSummaryToday: () => api.get('/cash-drawer/summary-today'),
  reconcile: (reconcileData) => api.post('/cash-drawer/reconcile', reconcileData),
  getHistory: (params) => api.get('/cash-drawer/history', { params }),
};

// Full Store Backup & Download Endpoints
export const backupService = {
  downloadBackup: () => api.get('/backup/export', { responseType: 'blob' }),
};

export default api;
