import React from 'react';
import {
  Package,
  Layers,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Barcode,
  ArrowRight,
  PlusCircle,
  Tag,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

const FootwearDashboard = ({ statsData, onAddProduct, onOpenPos }) => {
  const shoeSizes = [
    { size: 'Size 6', count: 14, inStock: true, status: 'Low' },
    { size: 'Size 7', count: 42, inStock: true, status: 'Optimal' },
    { size: 'Size 8', count: 68, inStock: true, status: 'Best Seller' },
    { size: 'Size 9', count: 54, inStock: true, status: 'Fast Moving' },
    { size: 'Size 10', count: 31, inStock: true, status: 'Optimal' },
    { size: 'Size 11', count: 9, inStock: true, status: 'Critical Low' },
  ];

  const brandBreakdown = [
    { brand: 'Handmade Peshawari Chappal (Kheri)', pairs: 48, revenue: 144000, share: 38 },
    { brand: 'Bata / Power Shoes', pairs: 36, revenue: 118800, share: 28 },
    { brand: 'Service / Cheetah Casuals', pairs: 27, revenue: 86400, share: 20 },
    { brand: 'Formal Leather Loafers (Local Artisan)', pairs: 18, revenue: 63000, share: 14 },
  ];

  const brokenSizeRuns = [
    {
      title: 'Italian Patent Leather Oxford (Black)',
      remaining: 'Only Size 6 left (1 pair)',
      recommendation: 'Markdown 20% or restock sizes 7-10',
      action: 'Restock Run',
    },
    {
      title: 'Noroz Pure Leather Peshawari Chappal (Mustard)',
      remaining: 'Only Size 11 left (2 pairs)',
      recommendation: 'Core sizes 8 & 9 sold out today',
      action: 'Urgent Order',
    },
    {
      title: 'Air Cushion Lightweight Sneaker (White)',
      remaining: 'Sizes 6 & 11 left',
      recommendation: 'Core run depleted over weekend',
      action: 'Restock Run',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title & Industry Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20">
            👟
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Footwear &amp; Shoes Mart Dashboard
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase font-mono">
                Pakistani Sizes 6-11
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              جوتے، سینڈلز اور پشاوری چپل اسٹور — سائز وائز اسٹاک، بروکن سائز رن الرٹس اور برانڈ اینالیٹکس
            </p>
          </div>
        </div>

        {/* Quick Module Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onAddProduct}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Shoe Model</span>
          </button>
          <button
            onClick={onOpenPos}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shoe Counter POS</span>
          </button>
        </div>
      </div>

      {/* 4 Footwear Domain KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pairs Sold Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Pairs Sold Today (جوڑے)</span>
            <span className="text-base">👟</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            129 Pairs
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Avg Rs. 2,850 per pair
          </div>
        </div>

        {/* 2. Top Selling Size */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Core Hot Size (سب سے تیز)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            Size 8 &amp; 9
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            67% of total footwear demand
          </div>
        </div>

        {/* 3. Broken Size Alert */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Broken Size Runs (نامکمل سیٹ)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            3 Models
          </div>
          <div className="text-[11px] font-medium text-rose-500">
            Action needed to avoid dead stock
          </div>
        </div>

        {/* 4. Total Footwear Inventory */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Stock on Shelves</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            480 Pairs
          </div>
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            Estimated Cost: Rs. 840,000
          </div>
        </div>
      </div>

      {/* Two Column Grid: Size Matrix Breakdown & Broken Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Footwear Size Run Matrix */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Footwear Size Run Availability Matrix</span>
                <span className="text-[11px] text-slate-400">(سائز اسٹاک)</span>
              </h3>
              <p className="text-xs text-slate-500">Live pair count across sizes 6 to 11 in store inventory</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600">Total: 218 Pairs</span>
          </div>

          <div className="space-y-3 pt-1">
            {shoeSizes.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{s.size}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{s.count} Pairs</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'Best Seller'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : s.status === 'Critical Low'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      s.status === 'Critical Low'
                        ? 'bg-rose-500'
                        : s.status === 'Best Seller'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (s.count / 70) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip for Shoe Mart Owners */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start space-x-2 text-xs text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Shoe Retail Tip:</strong> Order sizes 8 and 9 in 2x ratio compared to sizes 6 and 11 to prevent broken size runs from tying up your working capital.
            </span>
          </div>
        </div>

        {/* Right Column: Broken Size Run Alerts & Brand Turnover */}
        <div className="lg:col-span-5 space-y-6">
          {/* Broken Size Runs Alert Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Broken Size Run Alerts</span>
              </h3>
              <span className="text-[11px] font-bold text-rose-600">3 Models</span>
            </div>

            <div className="space-y-2.5">
              {brokenSizeRuns.map((b, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {b.title}
                    </span>
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full flex-shrink-0">
                      {b.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    ⚠️ {b.remaining}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {b.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Brand / Category Turnover</span>
              <span className="text-xs text-slate-500 font-normal">Today</span>
            </h3>

            <div className="space-y-2 text-xs">
              {brandBreakdown.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="truncate max-w-[190px]">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{b.brand}</span>
                    <span className="text-[10px] text-slate-500">{b.pairs} pairs sold</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 dark:text-white">Rs. {b.revenue.toLocaleString()}</span>
                    <span className="block text-[10px] text-amber-600 font-bold">{b.share}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FootwearDashboard;
