import React from 'react';
import {
  Sparkles,
  Droplet,
  Layers,
  TrendingUp,
  FlaskConical,
  PlusCircle,
  ShoppingBag,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const PerfumeDashboard = ({ statsData, onAddProduct, onOpenPos }) => {
  const fragranceNotes = [
    { note: 'Dehn Al Oud (دہن العود / Cambodian & Assam)', share: 36, mlDispensed: '420 ML', tolas: '18 Tolas', color: 'bg-amber-600' },
    { note: 'Royal French Musk (سفید مشک / Powdery Clean)', share: 28, mlDispensed: '340 ML', tolas: '12 Tolas', color: 'bg-blue-400' },
    { note: 'Amber Royale (عنبر شاہی / Warm Woody)', share: 20, mlDispensed: '280 ML', tolas: '8 Tolas', color: 'bg-amber-500' },
    { note: 'Fresh Citrus & Aquatic (Summer Blends)', share: 16, mlDispensed: '220 ML', tolas: '6 Tolas', color: 'bg-emerald-500' },
  ];

  const bottleSizes = [
    { size: '6 ML (Half Tola Crystal Bottle)', count: 48, revenue: 43200 },
    { size: '12 ML (1 Full Tola Velvet Box)', count: 32, revenue: 57600 },
    { size: '50 ML Eau De Parfum Spray (EDP)', count: 24, revenue: 84000 },
    { size: '100 ML Luxury Heavy Glass Flacon', count: 16, revenue: 88000 },
  ];

  const testerUsage = [
    { tester: 'Sauvage Impression Tester (50ml)', remaining: '18ml left (36%)', spraysToday: 42, conversions: 14, conversionRate: '33%' },
    { tester: 'Khamrah Qahwa Oil Tester (12ml)', remaining: '4ml left (33%)', spraysToday: 28, conversions: 11, conversionRate: '39%' },
    { tester: 'Aventus Creed Clone Tester (50ml)', remaining: '8ml left (16%)', spraysToday: 55, conversions: 19, conversionRate: '35%' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title & Industry Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-purple-500/10 via-pink-600/5 to-transparent border border-purple-500/20 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-purple-500/20">
            🧪
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Perfumery &amp; Attar House Dashboard
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 uppercase font-mono">
                ML &amp; Tola Formulations
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              عطر اور پرفیوم ہاؤس — ملی لیٹر اور تولہ پیمائش، کسٹم خوشبو بلینڈنگ اور ٹیسٹر کنورژن ٹریکر
            </p>
          </div>
        </div>

        {/* Quick Module Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onAddProduct}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Attar / Perfume</span>
          </button>
          <button
            onClick={onOpenPos}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 active:scale-95"
          >
            <Droplet className="w-3.5 h-3.5 text-pink-400" />
            <span>Fragrance POS Counter</span>
          </button>
        </div>
      </div>

      {/* 4 Perfume Domain KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Volume Dispensed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Volume Dispensed Today</span>
            <Droplet className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            1,260 ML
          </div>
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
            Equivalent to 44 Tolas
          </div>
        </div>

        {/* 2. Top Fragrance Family */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Top Note Profile (سب سے مقبول)</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            Dehn Al Oud
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            36% of daily fragrance sales
          </div>
        </div>

        {/* 3. Tester Bottle Depletion */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Tester Conversion Ratio</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            35.6%
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            1 in 3 tester sprays converts to sale
          </div>
        </div>

        {/* 4. Custom Blends Mixed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Custom Oil Blends Mixed</span>
            <FlaskConical className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-2xl font-black text-pink-600 dark:text-pink-400">
            18 Blends
          </div>
          <div className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
            Custom formula labels printed
          </div>
        </div>
      </div>

      {/* Two Column Grid: Fragrance Notes & Tester Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fragrance Note Profiles */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Fragrance Note Profiles &amp; Oil Volume</span>
                <span className="text-[11px] text-slate-400">(خوشبو نوٹس)</span>
              </h3>
              <p className="text-xs text-slate-500">Breakdown of pure oil essence consumption across fragrance categories</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600">Pure Essence</span>
          </div>

          <div className="space-y-3 pt-1">
            {fragranceNotes.map((n, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{n.note}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{n.mlDispensed}</span>
                    <span className="text-[10px] text-slate-500">({n.tolas})</span>
                    <span className="font-bold text-purple-600">{n.share}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${n.color}`} style={{ width: `${n.share * 2.5}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Bottle Size Turnover Table */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Bottle Size &amp; Packaging Turnover Today
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {bottleSizes.map((b, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <span className="font-bold text-slate-900 dark:text-white block truncate">{b.size}</span>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500">{b.count} bottles</span>
                    <span className="font-black text-purple-600">Rs. {b.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tester Bottle Conversion Watcher */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-purple-500" />
                <span>Tester Bottle Levels &amp; Conversion</span>
              </h3>
              <span className="text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-full">
                Active Tests
              </span>
            </div>
            <p className="text-xs text-slate-500">Monitor tester bottle depletion against direct checkout conversions</p>

            <div className="space-y-2.5 pt-1">
              {testerUsage.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{t.tester}</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      {t.conversionRate} Conversion
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>🧴 {t.remaining}</span>
                    <span>{t.spraysToday} tests → {t.conversions} sales</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert('Custom oil blend mixer tool opened.')}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
            >
              <span>🧪 Open Custom Oil Formulation Calculator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfumeDashboard;
