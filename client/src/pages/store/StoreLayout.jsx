import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { broadcastService } from '../../services/api';
import ThemeToggle from '../../components/common/ThemeToggle';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import QuickActionHeaderBar from '../../components/common/QuickActionHeaderBar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  Receipt,
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
  Clock,
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

  // Calculate remaining trial days
  const isTrial =
    tenantPlan === 'trial' ||
    user?.tenantPlan === 'trial' ||
    user?.plan === 'trial';

  const getRemainingTrialDays = () => {
    if (!isTrial) return null;
    const expiresAt = user?.subscriptionExpiresAt || user?.trialEndsAt;
    if (expiresAt) {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    }
    return 14; // Default trial duration
  };
  const remainingDays = getRemainingTrialDays();

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
    if (pathname.startsWith('/sales') || pathname.startsWith('/orders') || pathname.startsWith('/cashbook') || pathname.startsWith('/expenses'))
      return 'Sales & Expenses';
    if (pathname.startsWith('/staff') || pathname.startsWith('/users')) return 'Staff & Cashiers';
    if (pathname.startsWith('/billing') || pathname.startsWith('/settings')) return 'Store Plan & Billing';
    return 'Store Dashboard';
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

  // Global custom event listeners
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

  // Strict 7 Retail-Focused Items for Store Sidebar
  const navItems = [
    {
      to: '/dashboard',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
    },
    {
      to: '/pos',
      label: 'POS Billing',
      icon: ShoppingCart,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      isPrimaryAction: true,
      badge: totalItemCount > 0 ? totalItemCount : 'Active',
      badgeColor: 'bg-emerald-600 text-white font-black',
    },
    {
      to: '/inventory',
      label: 'Inventory & Variants',
      icon: Package,
      iconColor: 'text-cyan-500 dark:text-cyan-400',
    },
    {
      to: '/khata',
      label: 'Customer Khata',
      icon: BookOpen,
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
      to: '/sales',
      label: 'Sales & Expenses',
      icon: Receipt,
      iconColor: 'text-purple-500 dark:text-purple-400',
    },
    ...(isOwner
      ? [
          {
            to: '/staff',
            label: 'Staff & Cashiers',
            icon: Users,
            iconColor: 'text-rose-500 dark:text-rose-400',
          },
          {
            to: '/billing',
            label: 'My Subscription',
            icon: CreditCard,
            iconColor: 'text-emerald-500 dark:text-emerald-400',
            badge: isTrial ? `${remainingDays}d left` : null,
            badgeColor: 'bg-amber-500 text-slate-950 font-black',
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
          className={`no-print px-4 py-2 text-xs flex items-center justify-between border-b shadow-xs z-40 transition-colors ${
            activeBroadcast.type === 'maintenance'
              ? 'bg-rose-600 text-white border-rose-700'
              : activeBroadcast.type === 'promo'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-indigo-600 text-white border-indigo-700'
          }`}
        >
          <div className="flex items-center space-x-2 font-medium truncate">
            <Megaphone className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <span className="font-extrabold uppercase tracking-wider text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
              {activeBroadcast.type}
            </span>
            <span className="font-bold">{activeBroadcast.title}:</span>
            <span className="truncate opacity-95">{activeBroadcast.message}</span>
          </div>
          <button
            onClick={handleDismissBroadcast}
            className="p-1 hover:bg-white/20 rounded-md transition text-white ml-2 flex-shrink-0"
            title="Dismiss Announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. UNIVERSAL TOP BAR (Desktop + Tablet + Mobile)              */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-4 py-2 flex items-center justify-between shadow-2xs select-none">
        {/* Left: Sidebar Toggle Icon Button + Brand Logo + Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* THE PROMINENT SIDEBAR ICON IN THE TOP BAR */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            aria-label="Toggle Navigation Sidebar (Ctrl+B)"
            title="Toggle Sidebar (Ctrl+B)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Store Brand / Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2 group">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Store className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight block truncate max-w-[140px] sm:max-w-[220px]">
                {tenantName || 'NaveedPOS'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium leading-none truncate">
                {currentModuleLabel}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Actions: Trial Countdown Badge + Fast POS Action + Theme Toggle + User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Subtle 14-Day Free Trial Countdown Badge */}
          {isTrial && (
            <Link
              to="/billing"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition flex items-center space-x-1.5 min-h-[40px] active:scale-95"
              title="14-Day Free Trial Active. Click to Upgrade Plan"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="hidden sm:inline">14-Day Trial:</span>
              <span className="font-black text-amber-600 dark:text-amber-400">{remainingDays}d left</span>
            </Link>
          )}

          {/* Quick Counter POS Action Button */}
          <NavLink
            to="/pos"
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all min-h-[40px]"
            title="Open POS Terminal (F2)"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">POS Counter</span>
            {totalItemCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-700 text-[10px] font-black">
                {totalItemCount}
              </span>
            )}
          </NavLink>

          {/* Theme Toggle (Light / Dark Mode) */}
          <ThemeToggle />

          {/* User Sign Out */}
          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition flex items-center space-x-1.5 active:scale-95 min-h-[40px]"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Quick Action Navigation Bar */}
      <QuickActionHeaderBar />

      {/* ------------------------------------------------------------- */}
      {/* 2. BODY LAYOUT: DESKTOP SIDEBAR + MAIN CONTENT                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP SIDEBAR (visible on >= 1024px) */}
        <aside
          className={`hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 z-30 select-none ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Top of Sidebar: Store Indicator & Collapse Toggle */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  {user?.role === 'CASHIER' ? 'Cashier Mode' : 'Store Admin'}
                </span>
              </div>
            ) : (
              <div className="mx-auto">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            )}

            <button
              onClick={handleToggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links (7 Items Only) */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-xs font-bold transition-all duration-150 min-h-[44px] ${
                      isSidebarCollapsed
                        ? 'justify-center px-2 py-2.5'
                        : 'space-x-3 px-3.5 py-2.5'
                    } ${
                      isActive
                        ? item.isPrimaryAction
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                        : item.isPrimaryAction
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${item.iconColor}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 truncate tracking-tight">{item.label}</span>
                  )}
                  {!isSidebarCollapsed && item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer: Trial badge & cashier indicator */}
          {!isSidebarCollapsed && (
            <div className="p-3 m-2 rounded-2xl bg-slate-100/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {user?.name || 'Store Staff'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold uppercase">
                  {user?.role || 'Staff'}
                </span>
              </div>
              {isTrial && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">14-Day Free Trial</span>
                  <Link to="/billing" className="text-brand-600 dark:text-brand-400 font-extrabold hover:underline">
                    Upgrade
                  </Link>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ----------------------------------------------------------- */}
        {/* MOBILE SLIDE-OVER DRAWER (< 1024px)                         */}
        {/* ----------------------------------------------------------- */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-slate-950/75 backdrop-blur-md transition-opacity animate-fadeIn"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <div
          className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Store Navigation Menu"
        >
          {/* Mobile Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center space-x-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Store className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight block truncate max-w-[160px]">
                  {tenantName || 'NaveedPOS'}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {user?.role === 'CASHIER' ? 'Cashier Terminal' : 'Retail Management'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close Navigation Menu"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition min-tap"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation Links (7 Items Only) */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all min-tap ${
                      isActive
                        ? item.isPrimaryAction
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                        : item.isPrimaryAction
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${item.iconColor}`} />
                  <span className="flex-1 truncate tracking-tight">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Drawer Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
            {isTrial && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-300">14-Day Free Trial</span>
                <span className="font-black text-amber-600 dark:text-amber-400">{remainingDays}d left</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Dark / Light Mode</span>
              <ThemeToggle />
            </div>

            <button
              onClick={() => {
                setIsMobileOpen(false);
                logout();
                navigate('/login', { replace: true });
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition flex items-center justify-center space-x-2 min-tap"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Store</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. MAIN OUTLET CONTENT AREA                                   */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 focus:outline-none pb-16 lg:pb-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MOBILE BOTTOM QUICK NAVIGATION DOCK (< 1024px)             */}
      {/* ------------------------------------------------------------- */}
      <MobileBottomNav />
    </div>
  );
};

export default StoreLayout;
