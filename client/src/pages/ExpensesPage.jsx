import React, { useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/api';
import { formatCurrency } from '../utils/currency';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import {
  Receipt,
  PlusCircle,
  Search,
  Trash2,
  Calendar,
  Wallet,
  Building2,
  Zap,
  Coffee,
  Users,
  Truck,
  Wrench,
  Package,
  Layers,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Rent', label: 'Store Rent', icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
  { id: 'Electricity', label: 'Electricity / Utilities', icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { id: 'Tea & Refreshments', label: 'Tea & Refreshments', icon: Coffee, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'Salaries', label: 'Staff Salaries', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { id: 'Transport & Delivery', label: 'Transport & Delivery', icon: Truck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  { id: 'Maintenance', label: 'Maintenance & Repair', icon: Wrench, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
  { id: 'Packaging', label: 'Packaging & Bags', icon: Package, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
  { id: 'Miscellaneous', label: 'Miscellaneous', icon: Layers, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800' },
];

const ExpensesPage = () => {
  const [activePeriod, setActivePeriod] = useState('today');
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    count: 0,
    cashAmount: 0,
    bankAmount: 0,
    categoryBreakdown: {},
  });
  const [loading, setLoading] = useState(true);

  // New Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'Tea & Refreshments',
    title: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Cash',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        period: activePeriod,
        search: searchTerm,
      };
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (activePeriod === 'custom') {
        if (customDates.startDate) params.startDate = customDates.startDate;
        if (customDates.endDate) params.endDate = customDates.endDate;
      }

      const res = await expenseService.getExpenses(params);
      if (res.data.success) {
        setExpenses(res.data.expenses || []);
        setSummary(res.data.summary || {
          totalAmount: 0,
          count: 0,
          cashAmount: 0,
          bankAmount: 0,
          categoryBreakdown: {},
        });
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [activePeriod, customDates, categoryFilter, searchTerm]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handlePeriodChange = (period, customRange) => {
    setActivePeriod(period);
    if (customRange) {
      setCustomDates(customRange);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newExpense.title.trim()) {
      setFormError('Please enter an expense title/description.');
      return;
    }
    const amt = parseFloat(newExpense.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid expense amount greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await expenseService.createExpense({
        ...newExpense,
        amount: amt,
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setNewExpense({
          category: 'Tea & Refreshments',
          title: '',
          amount: '',
          date: new Date().toISOString().slice(0, 10),
          paymentMethod: 'Cash',
          notes: '',
        });
        fetchExpenses();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      return;
    }
    try {
      await expenseService.deleteExpense(id);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  // Find top spending category
  const topCategory = Object.entries(summary.categoryBreakdown || {}).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const exportCSV = () => {
    const headers = ['Date', 'Category', 'Title', 'Payment Method', 'Amount (PKR)', 'Notes'];
    const rows = expenses.map((exp) => [
      `"${new Date(exp.date).toLocaleDateString('en-PK')}"`,
      `"${exp.category}"`,
      `"${(exp.title || '').replace(/"/g, '""')}"`,
      `"${exp.paymentMethod || 'Cash'}"`,
      exp.amount,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `naveedpos-expenses-${activePeriod}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Store Expense Manager
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-full">
              Deducts from Net Profit
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track daily operating costs (rent, utility bills, staff lunch/tea, salaries, logistics)
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          <button
            type="button"
            onClick={exportCSV}
            disabled={expenses.length === 0}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center space-x-1.5 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Log</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex justify-end">
        <PeriodSelector
          activePeriod={activePeriod}
          onPeriodChange={handlePeriodChange}
          startDate={customDates.startDate}
          endDate={customDates.endDate}
          isLoading={loading}
        />
      </div>

      {/* Expense KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Period Expenses"
          value={formatCurrency(summary.totalAmount)}
          icon={Receipt}
          color="rose"
          subtitle={`${summary.count} expense record(s) logged`}
        />
        <StatCard
          title="Cash Paid Expenses"
          value={formatCurrency(summary.cashAmount)}
          icon={Wallet}
          color="amber"
          subtitle="Out of store cash register"
        />
        <StatCard
          title="Bank / Online Expenses"
          value={formatCurrency(summary.bankAmount)}
          icon={Zap}
          color="blue"
          subtitle="Raast & direct bank transfer"
        />
        <StatCard
          title="Highest Cost Driver"
          value={topCategory ? formatCurrency(topCategory[1]) : 'Rs 0'}
          icon={Building2}
          color="purple"
          subtitle={topCategory ? `${topCategory[0]}` : 'No records yet'}
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, category, or remarks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              categoryFilter === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.id}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Expense Title / Details</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold">No expenses recorded for this period.</p>
                    <p className="text-[11px] mt-0.5">Click "Log Expense" above to record daily store costs.</p>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const catMeta = CATEGORIES.find((c) => c.id === exp.category) || {
                    color: 'text-slate-600 bg-slate-100',
                  };
                  return (
                    <tr key={exp._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${catMeta.color}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {exp.title}
                        </div>
                        {exp.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {exp.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                          {formatCurrency(exp.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp._id, exp.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Store Daily Expense"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Title / Description *
            </label>
            <input
              type="text"
              required
              value={newExpense.title}
              onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
              placeholder="e.g. Daily staff lunch & evening tea, generator fuel"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (PKR) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Bank Transfer', 'Other'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setNewExpense({ ...newExpense, paymentMethod: method })}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    newExpense.paymentMethod === method
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              value={newExpense.notes}
              onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              placeholder="e.g. Paid to Aslam Chai wala"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
