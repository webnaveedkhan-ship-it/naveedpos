import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { broadcastService } from '../../services/api';
import {
  Store,
  User,
  LogOut,
  Menu,
  Shield,
  ShoppingCart,
  BookOpen,
  Building2,
  CreditCard,
  ArrowRight,
  UserCheck,
  BarChart3,
  Megaphone,
  X,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout, isAdmin, isSuperAdmin, tenantName, isImpersonating, exitImpersonation } =
    useAuth();

  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const res = await broadcastService.getActive();
        if (res.data?.success && res.data.broadcast) {
          const bcast = res.data.broadcast;
          const dismissedId = sessionStorage.getItem(`dismissed_bcast_${bcast._id}`);
          if (!dismissedId) {
            setActiveBroadcast(bcast);
          }
        }
      } catch {
        // Non-critical, ignore
      }
    };
    fetchBroadcast();
  }, []);

  const handleDismissBroadcast = () => {
    if (activeBroadcast?._id) {
      sessionStorage.setItem(`dismissed_bcast_${activeBroadcast._id}`, 'true');
    }
    setIsDismissed(true);
  };

  return (
    <>
      {/* Global System Broadcast Notification Banner (Dismissible) */}
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

      {/* Impersonation Banner if Super Admin is currently testing or viewing as a tenant */}
      {isImpersonating && (
        <div className="no-print bg-indigo-900 text-indigo-100 px-4 py-2 text-xs flex items-center justify-between border-b border-indigo-700 shadow-md">
          <div className="flex items-center space-x-2 font-medium">
            <UserCheck className="w-4 h-4 text-indigo-300 animate-pulse" />
            <span>
              <strong>Support Impersonation Mode:</strong> You are currently viewing as Store Admin for{' '}
              <strong className="underline underline-offset-2">{tenantName}</strong>.
            </span>
          </div>

          <button
            onClick={exitImpersonation}
            className="px-3 py-1 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-lg text-xs shadow-xs transition flex items-center space-x-1"
          >
            <span>Exit & Return to Super Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sticky top-0 z-30 shadow-xs transition-colors duration-200">
        <div className="px-4 py-2.5 flex items-center justify-between">
          {/* Left: Brand & Sidebar toggle & Tenant Badge */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation Sidebar"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to={isSuperAdmin && !isImpersonating ? '/super-admin' : '/dashboard'}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:bg-brand-500 transition">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Naveed<span className="text-brand-500">POS</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 -mt-1">
                  {isSuperAdmin && !isImpersonating ? 'SaaS Control Plane' : 'Retail Terminal'}
                </p>
              </div>
            </Link>

            {/* Active Tenant Store Name Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border">
              {isSuperAdmin && !isImpersonating ? (
                <div className="flex items-center gap-1.5 bg-indigo-950/60 text-indigo-300 border-indigo-800/80 px-2 py-0.5 rounded-md">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Super Admin SaaS Console</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-300 border-emerald-800/80 px-2 py-0.5 rounded-md">
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tenantName || 'Retail Store'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Center: Quick navigation pill */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-950/80 border border-slate-800/80 p-1 rounded-xl text-xs font-medium">
            {isSuperAdmin && !isImpersonating ? (
              <>
                <Link
                  to="/super-admin"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Telemetry</span>
                </Link>
                <Link
                  to="/super-admin/tenants"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tenants</span>
                </Link>
                <Link
                  to="/super-admin/payments"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Payments</span>
                </Link>
                <Link
                  to="/super-admin/broadcast"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <Megaphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Broadcast</span>
                </Link>
                <Link
                  to="/super-admin/audit"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Audit</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/pos"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal</span>
                </Link>
                <Link
                  to="/products"
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  Products
                </Link>
                <Link
                  to="/khata"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Khata</span>
                </Link>
                <Link
                  to="/orders"
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  Orders
                </Link>
                <Link
                  to="/reports"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reports</span>
                </Link>
                <Link
                  to="/settings/billing"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 hover:shadow-xs transition"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subscription</span>
                </Link>
              </>
            )}
          </div>

          {/* Right: Theme Toggle & User badge & Logout */}
          <div className="flex items-center space-x-2.5">
            {/* Universal Theme Toggle */}
            <ThemeToggle />

            <div className="flex items-center space-x-2.5 pl-2.5 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-tight">
                  {user?.name || 'Cashier'}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded uppercase tracking-wider ${
                      isSuperAdmin && !isImpersonating
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                        : isAdmin
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    }`}
                  >
                    <Shield className="w-2.5 h-2.5 mr-0.5" />
                    {user?.role || 'cashier'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Log out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
