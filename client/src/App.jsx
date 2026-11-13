import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import StoreLayout from './layouts/StoreLayout';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import PosPage from './pages/PosPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import DashboardPage from './pages/DashboardPage';
import KhataPage from './pages/KhataPage';
import SuperAdminPage from './pages/SuperAdminPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import ExpensesPage from './pages/ExpensesPage';
import SuppliersPage from './pages/SuppliersPage';
import BarcodeGeneratorPage from './pages/BarcodeGeneratorPage';
import StaffPage from './pages/StaffPage';
import ErrorBoundary from './components/common/ErrorBoundary';

// ----------------------------------------------------------------------
// 1. ROLE-BASED ROUTE GUARD WITH STRICT ARCHITECTURAL ISOLATION
// ----------------------------------------------------------------------
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isImpersonating, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          Loading NaveedPOS...
        </span>
      </div>
    );
  }

  // Synchronous localStorage fallback to prevent React 18 state batching race conditions
  const savedToken = localStorage.getItem('token');
  const savedUserStr = localStorage.getItem('user');
  let effectiveUser = user;
  if (!effectiveUser && savedUserStr) {
    try {
      effectiveUser = JSON.parse(savedUserStr);
    } catch (e) {}
  }

  const hasSession = isAuthenticated || (!!savedToken && !!effectiveUser);

  if (!hasSession) {
    if (allowedRoles.includes('SUPER_ADMIN')) {
      return <Navigate to="/super-admin-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveRole = (effectiveUser?.role || '').toUpperCase();
  const effectiveEmail = (effectiveUser?.email || '').toLowerCase();
  const isSuperAdmin =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'SUPERADMIN' ||
    effectiveEmail === 'naveed@naveedpos.com';

  // 1. Strict Isolation: Super Admin route requested
  if (allowedRoles.includes('SUPER_ADMIN')) {
    if (!isSuperAdmin) {
      // Store user attempting to visit Super Admin platform -> redirect to store dashboard
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // 2. Strict Isolation: Store route requested
  // If Super Admin visits a store route (and is not actively impersonating a store)
  if (isSuperAdmin && !isImpersonating) {
    return <Navigate to="/super-admin" replace />;
  }

  // 3. Sub-role restriction: Only store owners can access /staff and /billing
  if (allowedRoles.includes('STORE_OWNER')) {
    const isOwner =
      effectiveRole === 'STORE_OWNER' ||
      effectiveRole === 'STORE_ADMIN' ||
      effectiveRole === 'ADMIN' ||
      effectiveRole === '' ||
      isImpersonating;
    if (!isOwner && effectiveRole === 'CASHIER') {
      return <Navigate to="/pos" replace />;
    }
  }

  return children;
};

// ----------------------------------------------------------------------
// 2. ROOT & DEFAULT REDIRECT
// ----------------------------------------------------------------------
const RootRedirect = () => {
  const { user, isAuthenticated, isImpersonating } = useAuth();
  const savedToken = localStorage.getItem('token');
  const savedUserStr = localStorage.getItem('user');
  let effectiveUser = user;
  if (!effectiveUser && savedUserStr) {
    try {
      effectiveUser = JSON.parse(savedUserStr);
    } catch (e) {}
  }

  const hasSession = isAuthenticated || (!!savedToken && !!effectiveUser);
  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  const effectiveRole = (effectiveUser?.role || '').toUpperCase();
  const effectiveEmail = (effectiveUser?.email || '').toLowerCase();
  const isSuperAdmin =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'SUPERADMIN' ||
    effectiveEmail === 'naveed@naveedpos.com';

  if (isSuperAdmin && !isImpersonating) {
    return <Navigate to="/super-admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

// ----------------------------------------------------------------------
// 3. MAIN APPLICATION ROUTING TABLE
// ----------------------------------------------------------------------
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* ========================================================== */}
            {/* A. PUBLIC AUTHENTICATION & ONBOARDING ROUTES               */}
            {/* ========================================================== */}
            <Route path="/login" element={<LoginPage defaultTab="login" />} />
            <Route path="/store-login" element={<LoginPage defaultTab="login" />} />
            <Route path="/register" element={<SignUpPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/free-trial" element={<SignUpPage />} />
            <Route path="/super-admin-login" element={<LoginPage defaultTab="superadmin" isPrivateAdminRoute={true} />} />
            <Route path="/superadmin" element={<LoginPage defaultTab="superadmin" isPrivateAdminRoute={true} />} />
            <Route path="/admin-portal" element={<LoginPage defaultTab="superadmin" isPrivateAdminRoute={true} />} />
            <Route path="/auth" element={<LoginPage defaultTab="login" />} />

            {/* ========================================================== */}
            {/* B. SUPER ADMIN PLATFORM CONSOLE (/super-admin/*)          */}
            {/*    Exclusively for SUPER_ADMIN role (tenantId: null)       */}
            {/* ========================================================== */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SuperAdminPage />} />
              <Route path="stores" element={<SuperAdminPage />} />
              <Route path="tenants" element={<SuperAdminPage />} />
              <Route path="payments" element={<SuperAdminPage />} />
              <Route path="plans" element={<SuperAdminPage />} />
              <Route path="settings" element={<SuperAdminPage />} />
              <Route path="broadcast" element={<SuperAdminPage />} />
              <Route path="audit" element={<SuperAdminPage />} />
              <Route path=":tab" element={<SuperAdminPage />} />
            </Route>

            {/* ========================================================== */}
            {/* C. STORE ADMIN & RETAIL COUNTER DASHBOARD                 */}
            {/*    Exclusively for STORE_OWNER & CASHIER (tenantId: id)    */}
            {/* ========================================================== */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['STORE_OWNER', 'CASHIER']}>
                  <StoreLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/products" element={<Navigate to="/inventory" replace />} />
              <Route path="/products/barcode-generator" element={<BarcodeGeneratorPage />} />
              <Route path="/barcode-generator" element={<Navigate to="/products/barcode-generator" replace />} />
              <Route path="/khata" element={<KhataPage />} />
              <Route path="/sales" element={<OrdersPage />} />
              <Route path="/orders" element={<Navigate to="/sales" replace />} />
              <Route path="/cashbook" element={<ExpensesPage />} />
              <Route path="/expenses" element={<Navigate to="/cashbook" replace />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Owner-Restricted Store Management Routes */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={['STORE_OWNER']}>
                    <StaffPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/users" element={<Navigate to="/staff" replace />} />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute allowedRoles={['STORE_OWNER']}>
                    <BillingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<Navigate to="/billing" replace />} />
              <Route path="/settings/billing" element={<Navigate to="/billing" replace />} />
            </Route>

            {/* ========================================================== */}
            {/* D. FALLBACKS & ROOT REDIRECTS                             */}
            {/* ========================================================== */}
            <Route path="/naveedpos" element={<RootRedirect />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
