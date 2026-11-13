import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Building2,
  CreditCard,
  BarChart3,
  Wallet,
  Truck,
  Barcode,
  Activity,
  Megaphone,
  ShieldAlert,
  X,
  LogOut,
  Store,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, isSuperAdmin, isImpersonating, logout, tenantName } = useAuth();
  const { totalItemCount } = useCart();

  // Strict Super Admin mode check: Super Admin only sees platform governance items
  const isPureSuperAdmin = isSuperAdmin && !isImpersonating;

  // Lock background body scroll when mobile off-canvas drawer is open (< 1024px)
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Platform Owner Governance Items (Zero cashier/retail features)
  const superAdminNavItems = [
    {
      to: '/super-admin',
      label: 'Platform Telemetry',
      icon: Activity,
      badge: 'MRR',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      to: '/super-admin/tenants',
      label: 'Tenants Directory',
      icon: Building2,
      badge: 'Shops',
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      to: '/super-admin/payments',
      label: 'Payment Approvals',
      icon: CreditCard,
      badge: 'Slips',
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      to: '/super-admin/broadcast',
      label: 'System Broadcast',
      icon: Megaphone,
    },
    {
      to: '/super-admin/audit',
      label: 'Security Audit Log',
      icon: ShieldAlert,
    },
  ];

  // Store Merchant Retail Items (Only for Store Admins or Impersonating Sessions)
  const retailNavItems = [
    {
      to: '/dashboard',
      label: 'Store Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/pos',
      label: 'POS Terminal',
      icon: ShoppingCart,
      badge: totalItemCount > 0 ? totalItemCount : null,
      badgeColor: 'bg-brand-500 text-white',
    },
    {
      to: '/products',
      label: 'Products & Inventory',
      icon: Package,
    },
    {
      to: '/products/barcode-generator',
      label: 'Barcode Generator',
      icon: Barcode,
      badge: 'Print',
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      to: '/suppliers',
      label: 'Wholesale & Suppliers',
      icon: Truck,
    },
    {
      to: '/expenses',
      label: 'Store Expenses',
      icon: Wallet,
      badge: 'Daily',
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      to: '/khata',
      label: 'Khata Book (Udhar)',
      icon: BookOpen,
      badge: 'Udhar',
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      to: '/orders',
      label: 'Orders & Receipts',
      icon: Receipt,
    },
    {
      to: '/reports',
      label: 'Sales & Profit Reports',
      icon: BarChart3,
    },
    {
      to: '/settings/billing',
      label: 'Store Subscription',
      icon: CreditCard,
    },
  ];

  const navItems = isPureSuperAdmin ? superAdminNavItems : retailNavItems;

  return (
    <>
      {/* Mobile Backdrop Overlay (< 1024px / lg) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ease-out"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-72 lg:w-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        {/* Mobile Drawer Header (< 1024px / lg) */}
        <div className="flex lg:hidden items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                Naveed<span className="text-brand-500">POS</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                {isPureSuperAdmin ? 'SaaS Control Plane' : (tenantName || 'Retail Terminal')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-[0.97] transition flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Super Admin / Platform Owner Header Badge inside sidebar */}
        {isPureSuperAdmin && (
          <div className={`mx-3 mt-3 px-3 py-2 bg-indigo-950/50 border border-indigo-800/70 rounded-xl text-center ${!isOpen ? 'hidden lg:hidden' : ''}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
              SaaS Control Plane
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Platform Governance</p>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/super-admin' || item.to === '/dashboard'}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition group relative active:scale-[0.97] min-h-[44px] ${
                    isActive
                      ? 'bg-brand-950/50 text-brand-400 border border-brand-800/40 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
                title={!isOpen ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isOpen ? 'mr-3' : 'mx-auto lg:mx-auto'
                  }`}
                />

                <span className={`truncate ${isOpen ? 'inline' : 'inline lg:hidden'}`}>
                  {item.label}
                </span>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`${
                      item.badgeColor
                    } text-xs font-bold px-2 py-0.5 rounded-full ${
                      isOpen ? 'ml-auto' : 'ml-auto lg:absolute lg:top-1 lg:right-2'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Mobile User Profile & Quick Actions (< 1024px) */}
        <div className="lg:hidden p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {user?.name || 'Cashier'}
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {user?.role || 'cashier'}
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full min-h-[44px] flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs active:scale-[0.97] transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Desktop Collapse / Expand Toggle Bar (>= 1024px) */}
        <div className="hidden lg:block p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-[0.97] transition"
            title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isOpen ? (
              <div className="flex items-center text-xs font-medium space-x-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </div>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
