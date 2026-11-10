import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { superAdminService } from '../../services/api';
import MobileBottomSheet from './MobileBottomSheet';
import {
  ShoppingCart,
  Package,
  BookOpen,
  BarChart3,
  MoreHorizontal,
  Activity,
  Building2,
  CreditCard,
  Megaphone,
  ShieldAlert,
  Receipt,
  Wallet,
  Truck,
  Barcode,
  Layers,
  LogOut,
  ArrowRight,
  Shield,
  HelpCircle,
  Store,
} from 'lucide-react';

const MobileBottomNav = () => {
  const { user, isSuperAdmin, isImpersonating, logout, exitImpersonation, tenantName } = useAuth();
  const { totalItemCount, grandTotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const isPureSuperAdmin = isSuperAdmin && !isImpersonating;
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [pendingSlipsCount, setPendingSlipsCount] = useState(0);

  // For Super Admin: Fetch pending slips badge counter
  useEffect(() => {
    let isMounted = true;
    if (isPureSuperAdmin) {
      superAdminService
        .getMetrics()
        .then((res) => {
          if (isMounted && res.data?.success && res.data?.metrics?.pendingPaymentsCount) {
            setPendingSlipsCount(res.data.metrics.pendingPaymentsCount);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isPureSuperAdmin, location.pathname]);

  // Close "More" drawer on navigation
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90 z-40 flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom,0px)] transition-colors duration-200"
      >
        {isPureSuperAdmin ? (
          /* ========================================================== */
          /* SUPER ADMIN MOBILE BOTTOM BAR                              */
          /* ========================================================== */
          <>
            {/* 1. Overview */}
            <NavLink
              to="/super-admin"
              end
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap transition-colors ${
                  isActive || location.pathname === '/super-admin'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Activity className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Overview</span>
            </NavLink>

            {/* 2. Tenants */}
            <NavLink
              to="/super-admin/tenants"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap transition-colors ${
                  isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Building2 className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Tenants</span>
            </NavLink>

            {/* 3. Approvals (Center Action with Badge) */}
            <NavLink
              to="/super-admin/payments"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap relative transition-colors ${
                  isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <div className="relative">
                <CreditCard className="w-5 h-5" />
                {pendingSlipsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[16px] h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {pendingSlipsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Approvals</span>
            </NavLink>

            {/* 4. Broadcast */}
            <NavLink
              to="/super-admin/broadcast"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap transition-colors ${
                  isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Megaphone className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Broadcast</span>
            </NavLink>

            {/* 5. Audit */}
            <NavLink
              to="/super-admin/audit"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap transition-colors ${
                  isActive ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Audit</span>
            </NavLink>
          </>
        ) : (
          /* ========================================================== */
          /* MERCHANT RETAIL MOBILE BOTTOM BAR                          */
          /* ========================================================== */
          <>
            {/* 1. Products */}
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Products</span>
            </NavLink>

            {/* 2. Khata (Udhar) */}
            <NavLink
              to="/khata"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Khata</span>
            </NavLink>

            {/* 3. Center Elevated Action: POS Counter */}
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center -mt-5 min-tap group`
              }
            >
              <div
                className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 relative ${
                  location.pathname === '/pos'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30 ring-4 ring-slate-950'
                    : 'bg-emerald-600 text-white shadow-emerald-900/40 ring-4 ring-slate-950'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[18px] h-4.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-bold ${
                  location.pathname === '/pos' ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                POS Counter
              </span>
            </NavLink>

            {/* 4. Reports */}
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 min-tap transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">Reports</span>
            </NavLink>

            {/* 5. More Actions Sheet Trigger */}
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-1 min-tap text-slate-400 hover:text-slate-200 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">More</span>
            </button>
          </>
        )}
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* MERCHANT "MORE" SLIDE-UP BOTTOM SHEET                         */}
      {/* ------------------------------------------------------------- */}
      <MobileBottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title={tenantName || 'Store Operations'}
        subtitle="Quick access to all retail modules & settings"
      >
        <div className="space-y-4">
          {/* Active Impersonation Exit Banner */}
          {isImpersonating && (
            <div className="p-3 bg-amber-950/60 border border-amber-600/60 rounded-2xl flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-amber-200">Impersonation Session Active</span>
                <p className="text-[11px] text-amber-300/80">Logged in as merchant support</p>
              </div>
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  exitImpersonation();
                }}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs"
              >
                Exit Session
              </button>
            </div>
          )}

          {/* Quick Nav Links Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                navigate('/dashboard');
                setIsMoreOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left hover:bg-slate-800 transition flex items-center space-x-3"
            >
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Dashboard</div>
                <div className="text-[10px] text-slate-400">Store overview</div>
              </div>
            </button>

            <button
              onClick={() => {
                navigate('/orders');
                setIsMoreOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left hover:bg-slate-800 transition flex items-center space-x-3"
            >
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Orders & Bills</div>
                <div className="text-[10px] text-slate-400">Thermal receipts</div>
              </div>
            </button>

            <button
              onClick={() => {
                navigate('/expenses');
                setIsMoreOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left hover:bg-slate-800 transition flex items-center space-x-3"
            >
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Expenses</div>
                <div className="text-[10px] text-slate-400">Daily shop kharcha</div>
              </div>
            </button>

            <button
              onClick={() => {
                navigate('/suppliers');
                setIsMoreOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left hover:bg-slate-800 transition flex items-center space-x-3"
            >
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Suppliers</div>
                <div className="text-[10px] text-slate-400">Wholesale bills</div>
              </div>
            </button>

            <button
              onClick={() => {
                navigate('/products/barcode-generator');
                setIsMoreOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left hover:bg-slate-800 transition flex items-center space-x-3"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Barcode className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Barcode Labels</div>
                <div className="text-[10px] text-slate-400">Print stickers</div>
              </div>
            </button>

            <button
              onClick={() => {
                navigate('/settings/billing');
                setIsMoreOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left hover:bg-slate-800 transition flex items-center space-x-3"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Subscription</div>
                <div className="text-[10px] text-slate-400">Plan & validity</div>
              </div>
            </button>
          </div>

          {/* User profile & Logout */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{user?.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsMoreOpen(false);
                logout();
              }}
              className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
};

export default MobileBottomNav;
