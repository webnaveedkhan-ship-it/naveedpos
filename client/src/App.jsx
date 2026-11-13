import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import MobileBottomNav from './components/common/MobileBottomNav';
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

// Protected Route wrapper
const ProtectedRoute = ({ children, requireSuperAdmin = false, storeOnly = false }) => {
  const { isAuthenticated, isSuperAdmin, isImpersonating, loading } = useAuth();
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
  let effectiveUser = null;
  try {
    effectiveUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  } catch (e) {}

  const hasSession = isAuthenticated || (!!savedToken && !!effectiveUser);

  if (!hasSession) {
    if (requireSuperAdmin) {
      return <Navigate to="/super-admin-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveRole = (effectiveUser?.role || '').toUpperCase();
  const effectiveEmail = (effectiveUser?.email || '').toLowerCase();
  const effectiveIsSuperAdmin =
    isSuperAdmin ||
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'SUPERADMIN' ||
    effectiveRole === 'ADMIN' ||
    effectiveEmail === 'naveed@naveedpos.com' ||
    effectiveEmail === 'admin@naveedpos.com' ||
    effectiveEmail.includes('naveed');

  if (requireSuperAdmin && !effectiveIsSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Strict architectural separation: Super Admin (when not impersonating a store)
  // is strictly routed to the Platform Console (/super-admin) and cannot access store routes
  if (storeOnly && effectiveIsSuperAdmin && !isImpersonating) {
    return <Navigate to="/super-admin" replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  });
  const { isSuperAdmin, isImpersonating } = useAuth();

  // Listen for global custom events to open/toggle sidebar from any mobile button
  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen((prev) => !prev);
    const handleOpen = () => setIsSidebarOpen(true);
    const handleClose = () => setIsSidebarOpen(false);

    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('open-sidebar', handleOpen);
    window.addEventListener('close-sidebar', handleClose);

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('open-sidebar', handleOpen);
      window.removeEventListener('close-sidebar', handleClose);
    };
  }, []);

  const defaultRoute = isSuperAdmin && !isImpersonating ? '/super-admin' : '/dashboard';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1 flex overflow-visible lg:overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0">
          <ErrorBoundary>
            <Routes>
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/:tab"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute storeOnly>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pos"
                element={
                  <ProtectedRoute storeOnly>
                    <PosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute storeOnly>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/barcode-generator"
                element={
                  <ProtectedRoute storeOnly>
                    <BarcodeGeneratorPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/barcode-generator" element={<Navigate to="/products/barcode-generator" replace />} />
              <Route path="/inventory" element={<Navigate to="/products" replace />} />
              <Route
                path="/khata"
                element={
                  <ProtectedRoute storeOnly>
                    <KhataPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute storeOnly>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute storeOnly>
                    <ExpensesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <ProtectedRoute storeOnly>
                    <SuppliersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute storeOnly>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/billing"
                element={
                  <ProtectedRoute storeOnly>
                    <BillingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute storeOnly>
                    <StaffPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/users" element={<Navigate to="/staff" replace />} />
              <Route path="/settings" element={<Navigate to="/settings/billing" replace />} />
              <Route path="/billing" element={<Navigate to="/settings/billing" replace />} />
              <Route path="/" element={<Navigate to={defaultRoute} replace />} />
              <Route path="*" element={<Navigate to={defaultRoute} replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginPage defaultTab="login" />} />
            <Route path="/super-admin-login" element={<LoginPage defaultTab="superadmin" isPrivateAdminRoute={true} />} />
            <Route path="/superadmin" element={<LoginPage defaultTab="superadmin" isPrivateAdminRoute={true} />} />
            <Route path="/admin-portal" element={<LoginPage defaultTab="superadmin" isPrivateAdminRoute={true} />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/auth" element={<LoginPage defaultTab="login" />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
