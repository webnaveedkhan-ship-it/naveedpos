import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
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
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { isSuperAdmin, isImpersonating } = useAuth();
  const { totalItemCount } = useCart();

  // Strict Super Admin mode check: Super Admin only sees platform governance items
  const isPureSuperAdmin = isSuperAdmin && !isImpersonating;

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
    <aside
      className={`no-print hidden md:flex transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex-col z-20 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Super Admin / Platform Owner Header Badge inside sidebar */}
      {isPureSuperAdmin && isOpen && (
        <div className="mx-3 mt-3 px-3 py-2 bg-indigo-950/50 border border-indigo-800/70 rounded-xl text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
            SaaS Control Plane
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Platform Governance</p>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/super-admin' || item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 rounded-xl text-sm font-semibold transition group relative ${
                  isActive
                    ? 'bg-brand-950/50 text-brand-400 border border-brand-800/40 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              title={!isOpen ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isOpen ? 'mr-3' : 'mx-auto'
                }`}
              />

              {isOpen && <span className="truncate">{item.label}</span>}

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`${
                    item.badgeColor
                  } text-xs font-bold px-2 py-0.5 rounded-full ${
                    isOpen ? 'ml-auto' : 'absolute top-1 right-2'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse / Expand Toggle Bar */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
  );
};

export default Sidebar;
