import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { analyticsService, reportService } from '../services/api';
import { formatCurrency, CURRENCY_SYMBOL } from '../utils/currency';
import StatCard from '../components/common/StatCard';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import LowStockAlertWidget from '../components/dashboard/LowStockAlertWidget';
import CashDrawerModal from '../components/pos/CashDrawerModal';
import {
  KpiCardsSkeleton,
  ChartSkeleton,
  TopProductsSkeleton,
  TableSkeleton,
} from '../components/dashboard/DashboardSkeleton';
import {
  TrendingUp,
  Banknote,
  BookOpen,
  AlertTriangle,
  ShoppingCart,
  PlusCircle,
  ArrowRight,
  Receipt,
  Package,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Zap,
  BarChart3,
  DollarSign,
  ArrowDownRight,
  Percent,
  Download,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle2,
  Calculator,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active reporting period state: 'today' | 'this_week' | 'this_month' | 'custom'
  const [activePeriod, setActivePeriod] = useState('today');
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: '',
  });
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchronized multi-period fetcher
  const fetchDashboardData = useCallback(
    async (periodToFetch, customRange = null) => {
      try {
        setIsRefreshing(true);
        const params = {
          period: periodToFetch,
        };

        if (periodToFetch === 'custom') {
          const start = customRange?.startDate || customDates.startDate;
          const end = customRange?.endDate || customDates.endDate;
          if (start) params.startDate = start;
          if (end) params.endDate = end;
        }

        const res = await reportService.getDashboardMetrics(params);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to sync dashboard metrics:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [customDates]
  );

  // Initial load and whenever period changes
  useEffect(() => {
    fetchDashboardData(activePeriod);
  }, [activePeriod, fetchDashboardData]);

  // Handle period toggle from Segmented Control
  const handlePeriodChange = (newPeriod, optionalCustomRange = null) => {
    setActivePeriod(newPeriod);
    if (optionalCustomRange) {
      setCustomDates(optionalCustomRange);
      fetchDashboardData(newPeriod, optionalCustomRange);
    }
  };

  // CSV Export for active period
  const handleExportCsv = () => {
    const ordersToExport = data?.recentOrders || [];
    if (ordersToExport.length === 0) {
      alert(`No transactions found for ${data?.periodLabel || 'this period'}.`);
      return;
    }

    const headers = [
      'Order Number',
      'Date & Time',
      'Customer',
      'Payment Method',
      'Items Count',
      'Subtotal (Rs)',
      'Discount (Rs)',
      'Total Amount (Rs)',
      'Net Profit (Rs)',
      'Margin (%)',
    ];

    const rows = ordersToExport.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString('en-PK')}"`,
      `"${(o.customerName || 'Walk-in Customer').replace(/"/g, '""')}"`,
      `"${o.paymentMethod || 'CASH'}"`,
      o.itemsCount || 1,
      o.subtotal || o.grandTotal,
      o.discountAmount || 0,
      o.grandTotal || o.total,
      o.netProfit || 0,
      o.profitMargin || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `naveedpos-${activePeriod}-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isTrial = user?.tenantStatus === 'trial' || user?.tenantPlan === 'trial';

  const [restockToast, setRestockToast] = useState(null);

  const scrollToLowStock = () => {
    const el = document.getElementById('low-stock-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-amber-500');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-500');
      }, 2000);
    }
  };

  const handleRestockSuccess = (updatedProduct, quantityAdded) => {
    setData((prev) => {
      if (!prev) return prev;
      const currentList = prev.lowStockProducts || [];
      const threshold = Number(
        updatedProduct.lowStockAlert || updatedProduct.lowStockThreshold || 5
      );
      const newStock = Number(updatedProduct.stockQuantity || 0);

      let nextList;
      if (newStock > threshold) {
        // Product is now safely above reorder threshold, remove from critical alert list
        nextList = currentList.filter((p) => p._id !== updatedProduct._id);
      } else {
        // Still low stock, but with updated quantity and wholesale cost
        nextList = currentList
          .map((p) => (p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p))
          .sort((a, b) => Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0));
      }

      return {
        ...prev,
        lowStockProducts: nextList,
        summary: {
          ...prev.summary,
          lowStockCount: nextList.length,
        },
      };
    });

    setRestockToast({
      title: updatedProduct.title,
      quantityAdded,
      newStock: updatedProduct.stockQuantity,
    });

    setTimeout(() => {
      setRestockToast(null);
    }, 4500);
  };

  const {
    summary = {},
    paymentBreakdown = [],
    timeseries = [],
    topSellingProducts = [],
    recentOrders = [],
    lowStockProducts = [],
    periodLabel = 'Today',
  } = data || {};

  const safeLowStockProducts = Array.isArray(lowStockProducts)
    ? lowStockProducts
    : Array.isArray(data?.products)
    ? data.products
    : [];

  const safeRecentOrders = Array.isArray(recentOrders) && recentOrders.length > 0
    ? recentOrders
    : Array.isArray(data?.orders)
    ? data.orders
    : [];

  const safeTimeseries = Array.isArray(timeseries) ? timeseries : [];
  const safeTopSellingProducts = Array.isArray(topSellingProducts) ? topSellingProducts : [];

  const lowStockCount =
    summary.lowStockCount !== undefined
      ? summary.lowStockCount
      : safeLowStockProducts.length;

  const growth = summary.revenueGrowthPercent !== undefined ? summary.revenueGrowthPercent : 0;
  const isPositiveGrowth = growth >= 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-6"
    >
      {/* Restock Success Notification Toast */}
      {restockToast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 border border-emerald-500"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h5 className="font-extrabold text-sm tracking-tight">
                Inventory Restocked Successfully!
              </h5>
              <p className="text-xs text-white/90">
                Added +{restockToast.quantityAdded} units to &quot;{restockToast.title}&quot;. New total stock: {restockToast.newStock} units.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRestockToast(null)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 text-xs font-bold rounded-lg transition"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* 14-Day Free Trial / Subscription Countdown Banner */}
      {(isTrial || (user?.daysRemaining !== undefined && user.daysRemaining <= 14)) && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-700 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                <span>{isTrial ? '14-Day Free Trial Active' : 'Subscription Alert'}</span>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase">
                  {user?.daysRemaining !== undefined ? `${user.daysRemaining} Days Left` : '12 Days Left'}
                </span>
              </h4>
              <p className="text-xs text-white/80 mt-0.5">
                Enjoy full unmetered POS counter billing, reports & Khata ledger access.
              </p>
            </div>
          </div>
          <Link
            to="/settings/billing"
            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 flex-shrink-0"
          >
            <span>Upgrade Store Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {/* Header & Multi-Period Segmented Control */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Store Dashboard
            </h1>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                Syncing...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial performance, counter sales & customer udhar ledger
          </p>
        </div>

        {/* Action Controls & Multi-Period Segmented Control */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCashDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition shadow-xs"
            title="Audit Day-End Drawer Cash (Sham ka Hisaab)"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cash Drawer (شام کا حساب)</span>
          </button>

          <PeriodSelector
            activePeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
            startDate={customDates.startDate}
            endDate={customDates.endDate}
            isLoading={isRefreshing}
          />
        </div>
      </motion.div>

      {/* 1. Synchronized Top Metric Cards (KPIs) */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <KpiCardsSkeleton key="skeleton-kpis" />
        ) : (
          <motion.div
            key={`kpis-${activePeriod}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* 1. Total Sales Revenue */}
              <div className="transform transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5">
                <StatCard
                  title={`${periodLabel} Total Sales`}
                  value={formatCurrency(summary.totalSales || 0)}
                  icon={TrendingUp}
                  color="blue"
                  subtitle={
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        isPositiveGrowth
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500'
                      }`}
                    >
                      {isPositiveGrowth ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {Math.abs(growth)}% vs prev {activePeriod === 'today' ? 'day' : 'period'}
                      </span>
                    </span>
                  }
                />
              </div>

              {/* 2. Net Take-Home Profit (After Store Expenses) */}
              <div className="transform transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5">
                <StatCard
                  title={`${periodLabel} Net Profit`}
                  value={formatCurrency(summary.netProfit || 0)}
                  icon={DollarSign}
                  color="emerald"
                  subtitle={
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <span>Margin:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {summary.profitMargin || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400">(After Expenses)</span>
                    </span>
                  }
                />
              </div>

              {/* 3. Operating Store Expenses */}
              <div className="transform transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5">
                <StatCard
                  title={`${periodLabel} Expenses`}
                  value={formatCurrency(summary.totalExpenses || 0)}
                  icon={Wallet}
                  color="rose"
                  subtitle={
                    <Link
                      to="/expenses"
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Store Expenses</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  }
                />
              </div>

              {/* 4. Total Orders / Bills & AOV */}
              <div className="transform transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5">
                <StatCard
                  title={`${periodLabel} Orders`}
                  value={`${summary.orderCount || 0} Bills`}
                  icon={Receipt}
                  color="indigo"
                  subtitle={
                    <span className="text-slate-500 font-medium">
                      AOV:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatCurrency(summary.averageOrderValue || 0)}
                      </strong>
                    </span>
                  }
                />
              </div>

              {/* 5. Khata / Udhar Given in Period */}
              <div className="transform transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5">
                <StatCard
                  title={`${periodLabel} Udhar Given`}
                  value={formatCurrency(summary.khataUdharGiven || 0)}
                  icon={BookOpen}
                  color="amber"
                  subtitle={
                    <Link
                      to="/khata"
                      className="text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Khata Ledger</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  }
                />
              </div>

              {/* 6. Low Stock Warning KPI Card */}
              <div
                onClick={scrollToLowStock}
                className="transform transition duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
                title="Click to view and restock critical inventory items"
              >
                <StatCard
                  title="Low Stock Alert"
                  value={
                    <span className="flex items-center gap-2">
                      <span>
                        {lowStockCount} {lowStockCount === 1 ? 'Item' : 'Items'}
                      </span>
                      {lowStockCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                          Alert
                        </span>
                      )}
                    </span>
                  }
                  icon={AlertTriangle}
                  color={lowStockCount > 0 ? 'rose' : 'brand'}
                  subtitle={
                    lowStockCount > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <span>Restock Required</span>
                        <ArrowDownRight className="w-3.5 h-3.5 animate-bounce" />
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span>Stock Healthy</span>
                      </span>
                    )
                  }
                />
              </div>
            </div>

            {/* Cash, Card & Khata Collections Breakdown Bar */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  {periodLabel} Collections Split:
                </span>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Cash:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(summary.cashCollected || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Card:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(summary.cardCollected || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Khata Udhar:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {formatCurrency(summary.khataUdharGiven || 0)}
                  </span>
                </div>
              </div>

              {/* Quick POS New Sale Button */}
              <Link
                to="/pos"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex-shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New POS Sale</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Dynamic Sales & Profit Chart (Reacts strictly to Period) */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <ChartSkeleton key="skeleton-chart" />
        ) : (
          <motion.div
            key={`chart-${activePeriod}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  {activePeriod === 'today' && 'Hourly Sales Velocity (Today)'}
                  {activePeriod === 'this_week' && 'Weekly Sales & Profit Trajectory (Mon - Sun)'}
                  {activePeriod === 'this_month' && 'Monthly Revenue & Profit Curve (This Month)'}
                  {activePeriod === 'custom' && 'Sales & Profit Curve (Custom Date Range)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activePeriod === 'today' && 'Hourly turnover velocity across counter checkouts'}
                  {activePeriod === 'this_week' && 'Daily revenue totals and net margin split'}
                  {activePeriod === 'this_month' && 'Cumulative day-by-day turnover for the active month'}
                  {activePeriod === 'custom' && 'Filtered range sales and profit trend'}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                  <span className="w-3 h-3 rounded-md bg-brand-500 inline-block shadow-sm" /> Sales
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm" /> Profit
                </span>
                <Link
                  to="/reports"
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 ml-2"
                >
                  <span>Detailed Analytics ➔</span>
                </Link>
              </div>
            </div>

            {/* Dynamic Visualizer Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
              {safeTimeseries.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  No sales recorded for this period yet.
                </div>
              ) : (
                safeTimeseries.map((d, idx) => {
                  const maxRev = Math.max(
                    1,
                    ...safeTimeseries.map((item) => Number(item.revenue || 0))
                  );
                  const revHeight = Math.max(
                    8,
                    Math.round((Number(d.revenue || 0) / maxRev) * 140)
                  );
                  const profitHeight = Math.max(
                    4,
                    Math.round((Number(d.profit || 0) / maxRev) * 140)
                  );

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded-xl py-1.5 px-3 pointer-events-none whitespace-nowrap shadow-xl z-20">
                        <div className="font-bold">{d.label}</div>
                        <div>Sales: {formatCurrency(d.revenue || 0)}</div>
                        <div className="text-emerald-400 font-bold">
                          Profit: {formatCurrency(d.profit || 0)}
                        </div>
                        {d.orders !== undefined && (
                          <div className="text-slate-300 text-[9px]">{d.orders} orders</div>
                        )}
                      </div>

                      <div className="flex items-end gap-1 w-full max-w-[40px]">
                        {/* Revenue Bar */}
                        <div
                          className="flex-1 bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 rounded-t-md transition-all duration-300 shadow-xs"
                          style={{ height: `${revHeight}px` }}
                        />
                        {/* Profit Bar */}
                        <div
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 rounded-t-md transition-all duration-300 shadow-xs"
                          style={{ height: `${profitHeight}px` }}
                        />
                      </div>

                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Low Stock & Critical Inventory Restock Widget */}
      <motion.div variants={itemVariants}>
        <LowStockAlertWidget
          products={safeLowStockProducts}
          onRestockSuccess={handleRestockSuccess}
          isLoading={isLoading}
        />
      </motion.div>

      {/* 3. Lower Section: Detailed Transactions Table (2 Cols) & Top 5 Selling Products (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 4. Transactions / Sales Log Table (2 Cols) */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <TableSkeleton key="skeleton-table" />
            ) : (
              <motion.div
                key={`table-${activePeriod}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-brand-600" />
                      <span>{periodLabel} Sales Transactions</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {safeRecentOrders.length}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Real-time counter sales completed within this active period
                    </p>
                  </div>

                  {/* 1-Click CSV Export for active period */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={safeRecentOrders.length === 0}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 disabled:opacity-50"
                      title="Export this view to CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-600" />
                      <span>Export CSV</span>
                    </button>

                    <Link
                      to="/orders"
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold text-xs rounded-xl transition flex items-center space-x-1"
                    >
                      <span>All Orders</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold rounded-l-lg">Order #</th>
                        <th className="py-2.5 px-3 font-semibold">Customer</th>
                        <th className="py-2.5 px-3 font-semibold">Method</th>
                        <th className="py-2.5 px-3 font-semibold">Items</th>
                        <th className="py-2.5 px-3 font-semibold">Time</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Profit</th>
                        <th className="py-2.5 px-3 font-semibold text-right rounded-r-lg">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {safeRecentOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400">
                            No sales recorded for {periodLabel.toLowerCase()} yet.
                          </td>
                        </tr>
                      ) : (
                        safeRecentOrders.slice(0, 10).map((order) => {
                          const pm = (order.paymentMethod || 'CASH').toUpperCase();
                          return (
                            <tr
                              key={order._id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                            >
                              <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {order.orderNumber}
                              </td>
                              <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                                {order.customerName || order.customer?.name || 'Walk-in'}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                    pm === 'KHATA'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                      : pm === 'CARD'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                      : pm === 'SPLIT'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  }`}
                                >
                                  {pm}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500 text-[11px]">
                                {order.itemsCount || (order.items || []).length || 1}
                              </td>
                              <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                                {new Date(order.createdAt).toLocaleTimeString('en-PK', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                +{formatCurrency(order.netProfit || 0)}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                                {formatCurrency(order.grandTotal || order.total || 0)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Top-Selling Products Widget (Reacts strictly to Period) */}
        <div>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <TopProductsSkeleton key="skeleton-top-products" />
            ) : (
              <motion.div
                key={`products-${activePeriod}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{periodLabel} Best Sellers</span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Top performers ranked for this time window
                    </p>
                  </div>
                  <Link
                    to="/products"
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Catalog
                  </Link>
                </div>

                <div className="space-y-3">
                  {safeTopSellingProducts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No products sold during {periodLabel.toLowerCase()} yet.
                    </div>
                  ) : (
                    safeTopSellingProducts.map((p, idx) => (
                      <div
                        key={p._id || p.productId || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          {/* Product thumbnail */}
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                            <img
                              src={
                                p.image ||
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop'
                              }
                              alt={p.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop';
                              }}
                            />
                            <span className="absolute bottom-0 right-0 px-1 text-[8px] font-black bg-slate-900/80 text-white rounded-tl">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {p.category || 'Retail'} • {p.sku}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.totalRevenue || 0)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            {p.unitsSold || p.totalUnitsSold || 0} sold
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cash Drawer Audit Modal */}
      <CashDrawerModal
        isOpen={isCashDrawerOpen}
        onClose={() => setIsCashDrawerOpen(false)}
      />
    </motion.div>
  );
};

export default DashboardPage;