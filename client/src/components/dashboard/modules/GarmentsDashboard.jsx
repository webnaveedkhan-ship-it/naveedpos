import React from 'react';
import {
  Scissors,
  Layers,
  TrendingUp,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  PlusCircle,
  ShoppingBag,
  Shirt,
} from 'lucide-react';

const GarmentsDashboard = ({ statsData, onAddProduct, onOpenPos }) => {
  const sizeSplits = [
    { size: 'Small (S)', count: 32, percentage: 16, color: 'bg-blue-500' },
    { size: 'Medium (M)', count: 68, percentage: 34, color: 'bg-emerald-500' },
    { size: 'Large (L)', count: 56, percentage: 28, color: 'bg-amber-500' },
    { size: 'Extra Large (XL)', count: 30, percentage: 15, color: 'bg-purple-500' },
    { size: 'Double XL (XXL)', count: 14, percentage: 7, color: 'bg-rose-500' },
  ];

  const seasonalCollections = [
    { collection: 'Summer Lawn 3pc Stitched', pieces: 58, revenue: 261000, margin: '34%' },
    { collection: 'Men Wash & Wear Shalwar Kameez', pieces: 44, revenue: 176000, margin: '29%' },
    { collection: 'Unstitched Luxury Embroidered', pieces: 28, revenue: 196000, margin: '38%' },
    { collection: 'Casual Cotton Kurtis', pieces: 48, revenue: 96000, margin: '24%' },
  ];

  const pendingAlterations = [
    { customer: 'Mrs. Farooq', item: 'Silk Embroidered Shirt', alteration: 'Sleeve shortening 1.5"', readyDate: 'Today, 5:00 PM', status: 'Ready for Pickup' },
    { customer: 'Chaudhry Akram', item: 'Boski Men Suit', alteration: 'Trouser length 40"', readyDate: 'Tomorrow, 2:00 PM', status: 'In Tailoring' },
    { customer: 'Zubair Butt', item: 'Slim Fit Kurta', alteration: 'Fitting adjustment', readyDate: 'Today, 7:00 PM', status: 'Ready for Pickup' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title & Industry Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-500/10 via-indigo-600/5 to-transparent border border-blue-500/20 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
            👕
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Garments &amp; Boutique Dashboard
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 uppercase font-mono">
                Apparel Sizes S-XXL
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              گارمنٹس، بوتیک اور شلوار قمیض سینٹر — کلیکشن وائز سیلز، سائز بریک ڈاؤن اور ٹیلرنگ آلٹریشن ٹریکر
            </p>
          </div>
        </div>

        {/* Quick Module Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onAddProduct}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Dress / Suit</span>
          </button>
          <button
            onClick={onOpenPos}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Apparel POS Counter</span>
          </button>
        </div>
      </div>

      {/* 4 Garments Domain KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pieces Sold Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Pieces Sold Today (تعداد)</span>
            <Shirt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            178 Pieces
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Avg Rs. 4,100 per suit
          </div>
        </div>

        {/* 2. Most Popular Size */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Dominant Size (تیز ترین)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            Medium &amp; Large
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            62% of customer demand
          </div>
        </div>

        {/* 3. Pending Alterations */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Pending Alterations (ٹیلرنگ)</span>
            <Scissors className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            5 Fits
          </div>
          <div className="text-[11px] font-medium text-amber-600">
            2 ready for customer pickup
          </div>
        </div>

        {/* 4. Seasonal Turnover */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Seasonal Collection Revenue</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            Rs. 729,000
          </div>
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
            33% gross profit margin
          </div>
        </div>
      </div>

      {/* Two Column Grid: Garment Size Split & Alterations Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: S/M/L/XL/XXL Size Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Garments Size Distribution</span>
                <span className="text-[11px] text-slate-400">(سائز تناسب)</span>
              </h3>
              <p className="text-xs text-slate-500">Sales and stock distribution across standard apparel sizing</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">Total: 200 Pieces</span>
          </div>

          {/* Size Distribution Bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            {sizeSplits.map((s, idx) => (
              <div
                key={idx}
                className={`${s.color} h-full`}
                style={{ width: `${s.percentage}%` }}
                title={`${s.size}: ${s.count} pieces (${s.percentage}%)`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {sizeSplits.map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.size}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{s.count}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{s.percentage}% share</span>
                </div>
              </div>
            ))}
          </div>

          {/* Seasonal Collections Table */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Seasonal Collection Performance
            </h4>
            <div className="space-y-2 text-xs">
              {seasonalCollections.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{c.collection}</span>
                    <span className="text-[10px] text-slate-500">{c.pieces} suits sold • Margin: {c.margin}</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">Rs. {c.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alterations & Tailoring Pickup Queue */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-500" />
                <span>Tailoring &amp; Alteration Queue</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                3 Pending
              </span>
            </div>
            <p className="text-xs text-slate-500">Track client suit alterations, fitting dates and pickup statuses</p>

            <div className="space-y-2.5 pt-1">
              {pendingAlterations.map((a, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {a.customer}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.status === 'Ready for Pickup'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {a.item} • <span className="text-slate-500">{a.alteration}</span>
                  </p>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Ready: {a.readyDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert('New alteration ticket logged for tailor.')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
            >
              <span>+ Log New Customer Alteration Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarmentsDashboard;
