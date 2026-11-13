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
} from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingSlipsCount, setPendingSlipsCount] = useState(0);
  const [totalStoresCount, setTotalStoresCount] = useState(0);

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
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP PERMANENT SIDEBAR (>= 1024px)                      */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between hidden lg:flex flex-shrink-0 z-30 select-none">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white flex items-center gap-1">
                  Naveed<span className="text-indigo-400">POS</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 block -mt-0.5">
                  Platform Console
                </span>
              </div>
            </div>
          </div>

          {/* Master Administrator Profile Card */}
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

          {/* Navigation Links */}
          <nav className="px-2 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[42px] active:scale-[0.98] ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-black'
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

        {/* Footer: Theme Toggle & Logout */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition active:scale-95"
            title="Sign Out of Platform Console"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE TOP HEADER (< 1024px)                               */}
      {/* ------------------------------------------------------------- */}
      <header className="lg:hidden sticky top-0 z-40 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 text-white px-3 sm:px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open Platform Menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-white focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-black text-white leading-tight block">
                Naveed<span className="text-indigo-400">POS</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 -mt-0.5 block">
                Super Admin
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {pendingSlipsCount > 0 && (
            <button
              onClick={() => navigate('/super-admin/payments')}
              className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-black flex items-center gap-1 active:scale-95"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{pendingSlipsCount} Slips</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

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
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
  );
};

export default SuperAdminLayout;
