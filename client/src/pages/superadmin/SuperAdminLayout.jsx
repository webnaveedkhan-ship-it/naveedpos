import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { superAdminService } from '../../services/api';
import ThemeToggle from '../../components/common/ThemeToggle';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  Layers,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('naveedpos_superadmin_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [pendingSlipsCount, setPendingSlipsCount] = useState(0);
  const [totalStoresCount, setTotalStoresCount] = useState(0);

  // Toggle sidebar for both mobile (< 1024px drawer) and desktop (collapsed / expanded)
  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('naveedpos_superadmin_collapsed', String(next));
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

  // Fetch live metrics badge counts
  useEffect(() => {
    let isMounted = true;
    superAdminService
      .getMetrics()
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.metrics) {
          setPendingSlipsCount(res.data.metrics.pendingPaymentsCount || 0);
          setTotalStoresCount(res.data.metrics.totalStoresCount || res.data.metrics.totalTenants || 0);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

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

  // Strict 5-Item Navigation Architecture for Platform Console
  const navItems = [
    {
      to: '/super-admin',
      end: true,
      label: 'Platform Console',
      icon: Activity,
      iconColor: 'text-emerald-400',
    },
    {
      to: '/super-admin/stores',
      label: 'Stores / Tenants',
      icon: Building2,
      iconColor: 'text-indigo-400',
      badge: totalStoresCount > 0 ? totalStoresCount : null,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      to: '/super-admin/payments',
      label: 'Payment Approvals',
      icon: CreditCard,
      iconColor: 'text-amber-400',
      badge: pendingSlipsCount > 0 ? `${pendingSlipsCount} Slips` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      to: '/super-admin/plans',
      label: 'Subscription Plans',
      icon: Layers,
      iconColor: 'text-cyan-400',
    },
    {
      to: '/super-admin/settings',
      label: 'System Settings',
      icon: Settings,
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. UNIVERSAL TOP BAR (Desktop + Tablet + Mobile)              */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-2.5 sm:px-4 py-2 flex items-center justify-between shadow-2xs select-none">
        {/* Left: Sidebar Toggle Icon Button + Brand Logo + Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* THE PROMINENT SIDEBAR ICON IN THE TOP BAR */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            aria-label="Toggle Navigation Sidebar (Ctrl+B)"
            title="Toggle Sidebar (Ctrl+B)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Super Admin Brand / Logo */}
          <NavLink to="/super-admin" className="flex items-center space-x-2 group">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight block">
                Naveed<span className="text-indigo-600 dark:text-indigo-400">POS</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 block -mt-0.5">
                Platform Console
              </span>
            </div>
          </NavLink>
        </div>

        {/* Right Actions: Pending Slips Badge + Stores Count + Theme Toggle + Sign Out */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {pendingSlipsCount > 0 && (
            <button
              onClick={() => navigate('/super-admin/payments')}
              className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 transition shadow-xs min-h-[40px]"
              title="Pending Payment Verification Queue"
            >
              <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
              <span>{pendingSlipsCount} Slips</span>
            </button>
          )}

          {totalStoresCount > 0 && (
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{totalStoresCount} Stores</span>
            </div>
          )}

          {/* Theme Toggle (Light / Dark Mode) */}
          <ThemeToggle />

          {/* Super Admin User Identifier */}
          <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">
              NA
            </div>
            <div className="text-left">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px] leading-tight">
                {user?.name || 'Naveed Super Admin'}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                naveed@naveedpos.com
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition flex items-center space-x-1.5 active:scale-95 min-h-[40px]"
            title="Sign Out of Platform Console"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. BODY LAYOUT: DESKTOP SIDEBAR + MAIN CONTENT                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP SIDEBAR (visible on >= 1024px) */}
        <aside
          className={`hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-all duration-300 z-30 select-none ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Top of Sidebar: Workspace Indicator & Collapse Toggle */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
                  Global Platform
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

          {/* Navigation Links (5 Items Only) */}
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
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25'
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

          {/* Footer Info Box */}
          {!isSidebarCollapsed && (
            <div className="p-3 m-2 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Super Admin Tier</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Full platform root access. Multi-tenant database &amp; payment gateway management.
              </p>
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
          aria-label="Navigation Menu"
        >
          {/* Mobile Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center space-x-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight block">
                  Naveed<span className="text-indigo-600 dark:text-indigo-400">POS</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 block -mt-0.5">
                  Platform Console
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

          {/* Mobile Navigation Links (5 Items Only) */}
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
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25'
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
              <span>Sign Out of Platform</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. MAIN OUTLET CONTENT AREA                                   */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 focus:outline-none">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
