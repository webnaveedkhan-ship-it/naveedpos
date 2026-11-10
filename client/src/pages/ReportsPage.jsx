import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, CURRENCY_SYMBOL } from '../utils/currency';
import { exportDetailedSalesReportCsv } from '../utils/exportCsv';
import SalesProfitAreaChart from '../components/reports/SalesProfitAreaChart';
import PaymentDonutChart from '../components/reports/PaymentDonutChart';
import TopProductsChart from '../components/reports/TopProductsChart';
import {
  TrendingUp,
  Download,
  Printer,
  Search,
  Receipt,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Banknote,
  Coins,
  ArrowRight,
  Filter,
} from 'lucide-react';

const PERIOD_TABS = [
  { id: 'daily', label: 'Today', icon: '📅' },
  { id: 'weekly', label: 'This Week', icon: '📆' },
  { id: 'monthly', label: 'This Month', icon: '📊' },
  { id: 'custom', label: 'Custom Range', icon: '⚙️' },
];

const ReportsPage = () => {
  const { tenantName } = useAuth();

  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Fetch visual analytics from unified backend aggregation
  const fetchVisualReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = { period };
      if (period === 'custom') {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await reportService.getVisualAnalytics(params);
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load visual analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchVisualReports();
  }, [fetchVisualReports]);

  const {
    kpis = {
      grossSales: 0,
      cogs: 0,
      netProfit: 0,
      profitMargin: 0,
      marketUdhar: 0,
      totalOrders: 0,
      averageOrderValue: 0,
    },
    timelineChart = [],
    paymentMethods = [],
    topProducts = [],
    recentOrders = [],
    periodLabel = 'Today',
    dateRange = {},
  } = data || {};

  // Direct breakdown calculation for Cash & Online vs Khata Collected
  const cashCollected = Number(paymentMethods.find((p) => p.method === 'CASH')?.amount || 0);
  const cardCollected = Number(paymentMethods.find((p) => p.method === 'CARD')?.amount || 0);
  const collectedCashAndBank = cashCollected + cardCollected;
  const outstandingKhata = Number(kpis.marketUdhar || paymentMethods.find((p) => p.method === 'KHATA')?.amount || 0);

  // Filter orders by search & payment method
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q));

      const matchesPayment =
        paymentFilter === 'ALL' || (o.paymentMethod || '').toUpperCase() === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [recentOrders, searchQuery, paymentFilter]);

  // 1-Click Excel CSV Export
  const handleExportCSV = () => {
    if (!recentOrders || recentOrders.length === 0) {
      alert(`No sales data available to export for ${periodLabel}.`);
      return;
    }

    exportDetailedSalesReportCsv({
      storeName: tenantName || 'NaveedPOS Store',
      period,
      periodLabel,
      dateRangeStr: dateRange.formatted || '',
      summary: {
        totalSales: kpis.grossSales,
        totalCost: kpis.cogs,
        netProfit: kpis.netProfit,
        profitMargin: kpis.profitMargin,
        totalUdhar: outstandingKhata,
        orderCount: kpis.totalOrders,
        averageOrderValue: kpis.averageOrderValue,
      },
      orders: recentOrders,
    });
  };

  // 1-Click Ink-Friendly Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-6">
      {/* 1. Top Header & Action Buttons */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Financial Reports & Analytics
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Clean Numbers
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simplified financial suite: realized net profit, payment splits, and best-selling inventory
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading || recentOrders.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50 active:scale-95"
            title="Download Excel-ready CSV for active period"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || recentOrders.length === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50 active:scale-95"
            title="Open ink-friendly printable executive summary"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Dynamic Period Segmented Tabs */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
          {PERIOD_TABS.map((tab) => {
            const isActive = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id)}
                className={`relative flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeReportTab"
                    className="absolute inset-0 bg-brand-600 rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Range Pickers (shown only on Custom Tab) */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={fetchVisualReports}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl text-xs transition"
            >
              Apply Filter
            </button>
          </div>
        )}

        <div className="text-right text-[11px] text-slate-400 font-medium px-2">
          {dateRange.formatted || periodLabel}
        </div>
      </div>

      {/* 3. Top Summary KPI Cards (Clean Soft Cards) with Smooth Animated Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: Total Sales Revenue (Soft Emerald Highlight) */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              <span>Total Sales Revenue</span>
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {formatCurrency(kpis.grossSales)}
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-1 flex items-center justify-between">
              <span>Gross turnover</span>
              <span className="font-bold">{kpis.totalOrders} total sales</span>
            </p>
          </div>

          {/* Card 2: Real Net Profit (Selling Price - Cost Price with Margin Badge) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span>Real Net Profit</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800">
                {kpis.profitMargin}% Margin
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(kpis.netProfit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Calculated as Selling Price − Cost Price
            </p>
          </div>

          {/* Card 3: Cash & Online vs Khata Collected */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span>Cash & Bank Collected</span>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(collectedCashAndBank)}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center justify-between">
              <span>Customer Khata / Udhar:</span>
              <span className="font-bold">{formatCurrency(outstandingKhata)}</span>
            </div>
          </div>

          {/* Card 4: Total Bills Issued */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span>Total Bills Issued</span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {kpis.totalOrders} {kpis.totalOrders === 1 ? 'Bill' : 'Bills'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Average Bill Value: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(kpis.averageOrderValue)}</strong>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 4. The 3 Simple Visual Charts Suite (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Smooth Revenue & Profit Curve (AreaChart) - Takes 2 Cols */}
        <div className="lg:col-span-2">
          <SalesProfitAreaChart
            data={timelineChart}
            period={period}
            periodLabel={periodLabel}
          />
        </div>

        {/* Chart B: Payment Method Breakdown (Donut PieChart) - Takes 1 Col */}
        <div className="lg:col-span-1">
          <PaymentDonutChart
            paymentMethods={paymentMethods}
            totalOrders={kpis.totalOrders}
            grossSales={kpis.grossSales}
          />
        </div>
      </div>

      {/* Chart C: Top 5 Best-Selling Products (Rounded Horizontal BarChart) */}
      <div>
        <TopProductsChart
          topProducts={topProducts}
          periodLabel={periodLabel}
        />
      </div>

      {/* 5. Detailed Sales & Line-Item Audit Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Line-Item Order Ledger ({filteredOrders.length} transactions)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log with customer names, payment channels, cost of goods, and realized margins
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search order # or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none w-48 sm:w-60 focus:ring-1 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
              {['ALL', 'CASH', 'CARD', 'KHATA'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentFilter(method)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    paymentFilter === method
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {method === 'ALL' ? 'All' : method === 'KHATA' ? 'Khata' : method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3">Order / Receipt #</th>
                <th className="p-3">Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Items</th>
                <th className="p-3 text-right">Total Bill</th>
                <th className="p-3 text-right">Cost (COGS)</th>
                <th className="p-3 text-right">Net Profit</th>
                <th className="p-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">
                    Loading financial records...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">
                    No orders recorded matching filter criteria for {periodLabel.toLowerCase()}.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isCash = o.paymentMethod === 'CASH';
                  const isCard = o.paymentMethod === 'CARD';
                  const isKhata = o.paymentMethod === 'KHATA';

                  return (
                    <tr
                      key={o._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {o.orderNumber}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {o.timeStr || new Date(o.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {o.customerName || 'Walk-in'}
                        </div>
                        {o.customerPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {o.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isCash
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isCard
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {o.itemsCount || 1} {o.itemsCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(o.grandTotal || o.total)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {formatCurrency(o.totalCost || 0)}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(o.netProfit || 0)}
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px]">
                          {o.profitMargin || 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
