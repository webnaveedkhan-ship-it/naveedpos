import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  Plus,
  Package,
  UserPlus,
  BarChart3,
  Receipt,
  Sparkles,
  Zap,
} from 'lucide-react';

const QuickActionHeaderBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItemCount } = useCart();

  const isPos = location.pathname.startsWith('/pos');
  const isInventory = location.pathname.startsWith('/inventory') || location.pathname.startsWith('/products');
  const isKhata = location.pathname.startsWith('/khata');
  const isSales = location.pathname.startsWith('/sales') || location.pathname.startsWith('/orders');

  const handleAddProduct = () => {
    if (isInventory) {
      window.dispatchEvent(new CustomEvent('open-add-product'));
    } else {
      navigate('/inventory?action=add');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-add-product'));
      }, 50);
    }
  };

  const handleAddKhataCustomer = () => {
    if (isKhata) {
      window.dispatchEvent(new CustomEvent('open-add-customer'));
    } else {
      navigate('/khata?action=add');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-add-customer'));
      }, 50);
    }
  };

  return (
    <div className="no-print sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 px-3 sm:px-6 py-2 select-none z-30 transition-colors shadow-2xs">
      <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-0.5">
        {/* Left: Quick Label */}
        <div className="hidden md:flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Actions:</span>
        </div>

        {/* Right / Center: Action Shortcut Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-start sm:justify-end">
          {/* 1. [+ New Sale / POS] */}
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 active:scale-95 transition-all flex-shrink-0 shadow-xs ${
              isPos
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800'
            }`}
            title="Open POS Terminal (F2)"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
            <span>+ New Sale / POS</span>
            {totalItemCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                {totalItemCount}
              </span>
            )}
          </button>

          {/* 2. [+ Add Product] */}
          <button
            type="button"
            onClick={handleAddProduct}
            className="min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center space-x-1.5 flex-shrink-0"
            title="Add new product to catalog"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-500" />
            <span>+ Add Product</span>
          </button>

          {/* 3. [+ Add Khata Customer] */}
          <button
            type="button"
            onClick={handleAddKhataCustomer}
            className="min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 active:scale-95 transition-all flex items-center space-x-1.5 flex-shrink-0"
            title="Register new customer in Udhar Khata"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>+ Add Khata Customer</span>
          </button>

          {/* 4. [📊 View Sales History] */}
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 active:scale-95 transition-all flex-shrink-0 ${
              isSales
                ? 'bg-purple-600 text-white shadow-purple-600/30'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title="Inspect sales invoice logs and daily expenses"
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">📊 View Sales History</span>
            <span className="sm:hidden">📊 Sales</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionHeaderBar;
