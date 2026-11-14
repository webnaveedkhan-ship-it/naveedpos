import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { superAdminService } from '../services/api';
import ThemeToggle from '../components/common/ThemeToggle';
import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  Layers,
  Settings,
  Megaphone,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Activity,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
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
          setTotalStoresCount(res.data.metrics.totalStoresCount || 0);
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

  const navItems = [
    {
      to: '/super-admin',
      end: true,
      label: 'Platform Overview',
      icon: Activity,
      iconColor: 'text-emerald-400',
    },
    {
      to: '/super-admin/stores',
      label: 'Stores Directory',
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
      label: 'Plans & Pricing',
      icon: Layers,
      iconColor: 'text-cyan-400',
    },
    {
      to: '/super-admin/settings',
      label: 'Platform Settings',
      icon: Settings,
      iconColor: 'text-purple-400',
    },
    {
      to: '/super-admin/broadcast',
      label: 'System Broadcast',
      icon: Megaphone,
      iconColor: 'text-blue-400',
    },
    {
      to: '/super-admin/audit',
      label: 'Security Audit Log',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
    },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. UNIVERSAL TOP BAR (Desktop + Tablet + Mobile)              */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/95 border-b border-slate-800 text-white px-2.5 sm:px-4 py-2 flex items-center justify-between shadow-2xs select-none">
        {/* Left: Sidebar Toggle Icon Button + Brand Logo + Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* THE PROMINENT SIDEBAR ICON IN THE TOP BAR */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            aria-label="Toggle Navigation Sidebar (Ctrl+B)"
            title="Toggle Sidebar (Ctrl+B)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-white border border-slate-700/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Super Admin Brand / Logo */}
          <NavLink to="/super-admin" className="flex items-center space-x-2 group">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight text-white leading-tight block">
                Naveed<span className="text-indigo-400">POS</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 block -mt-0.5">
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
              className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 transition shadow-xs min-h-[40px]"
              title="Pending Payment Verification Queue"
            >
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{pendingSlipsCount} Slips</span>
            </button>
          )}

          {totalStoresCount > 0 && (
            <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded-xl text-xs font-bold min-h-[40px]">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{totalStoresCount} Stores</span>
            </div>
          )}

          <ThemeToggle />

          <button
            type="button"
            onClick={logout}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition active:scale-95 min-h-[40px]"
            title="Sign Out of Platform Console"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
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
          } bg-slate-900 border-r border-slate-800 flex-col justify-between hidden lg:flex flex-shrink-0 z-30 transition-all duration-300 ease-in-out select-none`}
        >
          <div>
            {/* Master Administrator Profile Card (Expanded only) */}
            {!isSidebarCollapsed && (
              <div className="m-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white truncate">Naveed</p>
                    <p className="text-[10px] text-slate-400 truncate">Platform Super Admin</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Control Plane
                  </span>
                  <span className="font-mono text-slate-500">v2.6.0</span>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className={`px-2 space-y-1 ${isSidebarCollapsed ? 'mt-3' : 'mt-1'}`}>
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
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                      } rounded-xl text-xs font-bold transition-all min-h-[42px] active:scale-[0.98] ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
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

          {/* Footer: Toggle Collapse + Logout */}
          <div className="p-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToggleSidebar}
              className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ${
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
                className="flex items-center space-x-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition active:scale-95"
                title="Sign Out of Platform Console"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </aside>

        {/* ------------------------------------------------------------- */}
        {/* 3. MOBILE SLIDE-OVER DRAWER (< 1024px)                        */}
        {/* ------------------------------------------------------------- */}
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Blurred Backdrop */}
            <div
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
            />

            {/* Slide-Over Drawer Content */}
            <div className="relative w-[280px] max-w-[85vw] bg-slate-900 text-white border-r border-slate-800 flex flex-col justify-between p-4 shadow-2xl z-10 transform transition-transform duration-300 ease-out">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-white">Platform Console</span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">Super Admin</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
                    aria-label="Close Navigation Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Drawer Links */}
                <nav className="space-y-1">
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
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-md'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
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
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. MAIN PLATFORM CONTENT AREA                                 */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 text-slate-100 min-h-0 animate-fadeIn">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
