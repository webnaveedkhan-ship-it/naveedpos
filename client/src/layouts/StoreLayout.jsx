import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { broadcastService } from '../services/api';
import ThemeToggle from '../components/common/ThemeToggle';
import MobileBottomNav from '../components/common/MobileBottomNav';
import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  Receipt,
  Wallet,
  Truck,
  Barcode,
  BarChart3,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  Store,
  UserCheck,
  ArrowRight,
  Megaphone,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const StoreLayout = () => {
  const { user, logout, isImpersonating, exitImpersonation, tenantName, tenantPlan } = useAuth();
  const { totalItemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('naveedpos_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if current user is owner or admin (can see staff & billing)
  const isOwner =
    user?.role === 'STORE_OWNER' ||
    user?.role === 'STORE_ADMIN' ||
    user?.role === 'ADMIN' ||
    !user?.role ||
    user?.role === 'SUPER_ADMIN'; // when impersonating

  // Toggle sidebar for both mobile (< 1024px drawer) and desktop (collapsed / expanded)
  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('naveedpos_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar anywhere
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute active module title for top bar display
  const getModuleLabel = (pathname) => {
    if (pathname.startsWith('/pos')) return 'POS Billing Counter';
    if (pathname.startsWith('/inventory') || pathname.startsWith('/products')) return 'Products & Inventory';
    if (pathname.startsWith('/khata')) return 'Customer Udhar (Khata)';
    if (pathname.startsWith('/sales') || pathname.startsWith('/orders')) return 'Sales & Invoices';
    if (pathname.startsWith('/cashbook') || pathname.startsWith('/expenses')) return 'Daily Cashbook (Hisaab)';
    if (pathname.startsWith('/suppliers')) return 'Wholesale Suppliers';
    if (pathname.startsWith('/reports')) return 'Sales Analytics';
    if (pathname.startsWith('/staff') || pathname.startsWith('/users')) return 'Staff Management';
    if (pathname.startsWith('/billing') || pathname.startsWith('/settings')) return 'Store Plan & Billing';
    return 'Retail Counter';
  };
  const currentModuleLabel = getModuleLabel(location.pathname);

  // Fetch active broadcast announcement
  useEffect(() => {
    let isMounted = true;
    broadcastService
      .getActive()
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.broadcast) {
          const bcast = res.data.broadcast;
          const dismissedId = sessionStorage.getItem(`dismissed_bcast_${bcast._id}`);
          if (!dismissedId) {
            setActiveBroadcast(bcast);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismissBroadcast = () => {
    if (activeBroadcast?._id) {
      sessionStorage.setItem(`dismissed_bcast_${activeBroadcast._id}`, 'true');
    }
    setIsDismissed(true);
  };

  // Lock body scroll when mobile off-canvas drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Listen for global custom events to open/toggle mobile drawer from bottom nav or buttons
  useEffect(() => {
    const handleToggle = () => handleToggleSidebar();
    const handleOpen = () => setIsMobileOpen(true);
    const handleClose = () => setIsMobileOpen(false);

    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('open-sidebar', handleOpen);
    window.addEventListener('close-sidebar', handleClose);

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('open-sidebar', handleOpen);
      window.removeEventListener('close-sidebar', handleClose);
    };
  }, []);

  const navItems = [
    {
      to: '/dashboard',
      end: true,
      label: 'Store Dashboard',
      icon: LayoutDashboard,
      iconColor: 'text-emerald-500',
    },
    {
      to: '/pos',
      label: 'POS Terminal',
      icon: ShoppingCart,
      iconColor: 'text-emerald-400',
      badge: totalItemCount > 0 ? totalItemCount : null,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      to: '/inventory',
      label: 'Products & Inventory',
      icon: Package,
      iconColor: 'text-indigo-400',
    },
    {
      to: '/products/barcode-generator',
      label: 'Barcode Generator',
      icon: Barcode,
      iconColor: 'text-purple-400',
      badge: 'Print',
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      to: '/khata',
      label: 'Customer Udhar (Khata)',
      icon: BookOpen,
      iconColor: 'text-amber-400',
    },
    {
      to: '/sales',
      label: 'Sales & Receipts',
      icon: Receipt,
      iconColor: 'text-teal-400',
    },
    {
      to: '/cashbook',
      label: 'Daily Cashbook (Hisaab)',
      icon: Wallet,
      iconColor: 'text-cyan-400',
    },
    {
      to: '/suppliers',
      label: 'Wholesale & Suppliers',
      icon: Truck,
      iconColor: 'text-blue-400',
    },
    {
      to: '/reports',
      label: 'Sales Reports & Analytics',
      icon: BarChart3,
      iconColor: 'text-violet-400',
    },
    ...(isOwner
      ? [
          {
            to: '/staff',
            label: 'Cashiers & Staff',
            icon: Users,
            iconColor: 'text-rose-400',
          },
          {
            to: '/billing',
            label: 'Store Plan & Billing',
            icon: CreditCard,
            iconColor: 'text-emerald-400',
          },
        ]
      : []),
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* ------------------------------------------------------------- */}
      {/* 0. BANNERS: IMPERSONATION & SYSTEM BROADCAST                  */}
      {/* ------------------------------------------------------------- */}
      {isImpersonating && (
        <div className="no-print bg-indigo-900 text-indigo-100 px-4 py-2 text-xs flex items-center justify-between border-b border-indigo-700 shadow-md z-50">
          <div className="flex items-center space-x-2 font-medium">
            <UserCheck className="w-4 h-4 text-indigo-300 animate-pulse" />
            <span>
              <strong>Support Impersonation Mode:</strong> You are viewing as Store Admin for{' '}
              <strong className="underline underline-offset-2">{tenantName || 'Store'}</strong>.
            </span>
          </div>

          <button
            onClick={exitImpersonation}
            className="px-3 py-1 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-lg text-xs shadow-xs transition flex items-center space-x-1 active:scale-95"
          >
            <span>Exit &amp; Return to Super Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeBroadcast && !isDismissed && (
        <div
          className={`no-print px-4 py-2 text-xs flex items-center justify-between border-b shadow-xs transition z-50 ${
            activeBroadcast.type === 'alert' || activeBroadcast.type === 'warning'
              ? 'bg-amber-600 text-white border-amber-700'
              : activeBroadcast.type === 'success'
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-brand-700 text-white border-brand-800'
          }`}
        >
          <div className="flex items-center space-x-2 font-medium">
            <Megaphone className="w-4 h-4 text-white animate-bounce flex-shrink-0" />
            <span>
              <strong>{activeBroadcast.title}:</strong> {activeBroadcast.message}
            </span>
          </div>

          <button
            onClick={handleDismissBroadcast}
            className="p-1 hover:bg-black/20 rounded-lg text-white transition ml-2 flex-shrink-0"
            title="Dismiss Announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. UNIVERSAL TOP BAR (Desktop + Tablet + Mobile)              */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800/80 px-2.5 sm:px-4 py-2 flex items-center justify-between shadow-2xs select-none">
        {/* Left: Sidebar Toggle Icon Button + Brand Logo + Page Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* THE PROMINENT SIDEBAR ICON IN THE TOP BAR */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            aria-label="Toggle Navigation Sidebar (Ctrl+B)"
            title="Toggle Sidebar (Ctrl+B)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Store Brand / Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2 group">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Store className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight block truncate max-w-[130px] sm:max-w-[200px]">
                {tenantName || 'NaveedPOS Store'}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 block -mt-0.5">
                {currentModuleLabel}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Actions: POS Terminal Shortcut + Khata + Theme Toggle + User Badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Quick POS Terminal CTA Button */}
          <Link
            to="/pos"
            className="px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 transition-all min-h-[40px]"
            title="Open POS Terminal Billing Counter"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">POS Terminal</span>
            <span className="sm:hidden font-bold">POS</span>
            {totalItemCount > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-950 text-white rounded-full text-[10px] font-black min-w-[18px] text-center animate-pulse">
                {totalItemCount}
              </span>
            )}
          </Link>

          {/* Quick Khata Link (Desktop & Tablet) */}
          <Link
            to="/khata"
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 min-h-[40px] transition active:scale-95"
            title="Customer Udhar Ledger"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Khata</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Pill (Desktop) */}
          <div className="hidden lg:flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-[11px]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left">
              <p className="font-bold text-[11px] leading-tight text-slate-900 dark:text-white truncate max-w-[90px]">
                {user?.name || 'Operator'}
              </p>
              <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                {user?.role === 'CASHIER' ? 'Cashier' : 'Store Admin'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area: Desktop Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ------------------------------------------------------------- */}
        {/* 2. DESKTOP COLLAPSIBLE SIDEBAR (>= 1024px)                    */}
        {/* ------------------------------------------------------------- */}
        <aside
          className={`${
            isSidebarCollapsed ? 'w-18' : 'w-64'
          } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between hidden lg:flex flex-shrink-0 z-30 transition-all duration-300 ease-in-out select-none`}
        >
          <div>
            {/* Store Information Card (Only in Expanded mode) */}
            {!isSidebarCollapsed && (
              <div className="m-3 p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {tenantName || 'My Retail Store'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.role === 'CASHIER' ? 'Cashier Terminal' : 'Store Admin'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {tenantPlan === 'premium' ? 'Enterprise' : tenantPlan === 'standard' ? 'Standard' : '14-Day Trial'}
                  </span>
                  <Link to="/billing" className="text-slate-500 hover:text-emerald-500 font-bold">
                    Manage
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <nav
              className={`px-2 space-y-0.5 ${
                isSidebarCollapsed ? 'mt-3' : 'mt-1'
              } max-h-[calc(100vh-220px)] overflow-y-auto no-scrollbar`}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                      } rounded-xl text-xs font-bold transition-all min-h-[40px] active:scale-[0.98] ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${item.iconColor}`} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black rounded-full truncate ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer: Toggle Collapse + Sign Out */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToggleSidebar}
              className={`p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                isSidebarCollapsed ? 'w-full flex justify-center' : ''
              }`}
              title={isSidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition active:scale-95"
                title="Sign Out of Store Counter"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </aside>

        {/* ------------------------------------------------------------- */}
        {/* 3. MOBILE SLIDE-OVER DRAWER (< 1024px)                        */}
        {/* ------------------------------------------------------------- */}
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Blurred Backdrop with Tap-Outside Dismiss */}
            <div
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
            />

            {/* Slide-Over Drawer Content */}
            <div className="relative w-[280px] max-w-[85vw] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 shadow-2xl z-10 transform transition-transform duration-300 ease-out">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-black block truncate max-w-[160px]">
                        {tenantName || 'Store Dashboard'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                        Retail Counter
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                    aria-label="Close Navigation Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Drawer Links */}
                <nav className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto no-scrollbar">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setIsMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] active:scale-[0.98] ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`
                        }
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${item.iconColor}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-full truncate ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. MAIN RETAIL CONTENT AREA                                   */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-0 pb-16 md:pb-0 animate-fadeIn">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. MOBILE BOTTOM NAVIGATION (Phones < 768px)                  */}
      {/* ------------------------------------------------------------- */}
      <MobileBottomNav />
    </div>
  );
};

export default StoreLayout;
