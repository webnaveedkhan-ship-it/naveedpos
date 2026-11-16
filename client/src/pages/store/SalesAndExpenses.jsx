import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import OrdersPage from '../OrdersPage';
import ExpensesPage from '../ExpensesPage';
import { Receipt, Wallet } from 'lucide-react';

const SalesAndExpenses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'expenses' ? 'expenses' : 'invoices';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Tab Bar for Sales & Expenses */}
      <div className="p-3 sm:px-6 sm:pt-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleTabChange('invoices')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition min-tap ${
              activeTab === 'invoices'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales Invoices &amp; Receipts</span>
          </button>

          <button
            onClick={() => handleTabChange('expenses')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition min-tap ${
              activeTab === 'expenses'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Daily Shop Expenses (Hisaab)</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'invoices' ? <OrdersPage /> : <ExpensesPage />}
      </div>
    </div>
  );
};

export default SalesAndExpenses;
