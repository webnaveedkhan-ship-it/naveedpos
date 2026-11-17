import React from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  Scale,
  Box,
  TrendingUp,
  Clock,
  PlusCircle,
  ShoppingBag,
  Zap,
} from 'lucide-react';

const SupermartDashboard = ({ statsData, onAddProduct, onOpenPos }) => {
  const fmcgStaples = [
    { name: 'Kisan Canola Cooking Oil (5 Litre Tin)', category: 'Edible Oil', stock: '28 Tins', dailyTurnover: '14 Tins', status: 'In Demand' },
    { name: 'Sunridge Chakki Atta (10 KG Bag)', category: 'Flour & Grains', stock: '45 Bags', dailyTurnover: '22 Bags', status: 'High Volume' },
    { name: 'Refined White Sugar (loose 50kg bag)', category: 'Staples / Loose', stock: '8 Bags', dailyTurnover: '3 Bags (150 KG)', status: 'Optimal' },
    { name: 'Tapal Danedar Tea (900g Family Pack)', category: 'Beverages', stock: '34 Packs', dailyTurnover: '18 Packs', status: 'In Demand' },
  ];

  const expiryWatchdog = [
    { item: 'Olpers Full Cream Milk (1 Litre Tetra)', expiry: '12 Days Left (01 Dec 2026)', stock: '36 Packs', urgency: 'CRITICAL' },
    { item: 'Nurpur Salted Butter (200g)', expiry: '18 Days Left (07 Dec 2026)', stock: '14 Bricks', urgency: 'WARNING' },
    { item: 'English Toast Bread (Large)', expiry: '3 Days Left (21 Nov 2026)', stock: '8 Loaves', urgency: 'URGENT' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title & Industry Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-emerald-500/10 via-teal-600/5 to-transparent border border-emerald-500/20 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/20">
            🛒
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Supermart &amp; Kiryana Mart Dashboard
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase font-mono">
                FMCG &amp; Loose Weight
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              سپر اسٹور، کریانہ اور کیش اینڈ کیری — بارکوڈ اسکیننگ، وزنی اشیاء (کلو/گرام) اور ایکسپائری واچ ڈاگ
            </p>
          </div>
        </div>

        {/* Quick Module Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onAddProduct}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Grocery Item</span>
          </button>
          <button
            onClick={onOpenPos}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Rush Hour POS (F2)</span>
          </button>
        </div>
      </div>

      {/* 4 Supermart Domain KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Invoices / Transactions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Checkout Invoices (روزانہ بل)</span>
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            348 Bills
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Peak rush: 6:00 PM – 9:00 PM
          </div>
        </div>

        {/* 2. Loose Weight Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Loose Weight Sales (کلو/گرام)</span>
            <Scale className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
            420 KG Sold
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Sugar, Daal, Rice &amp; Spices
          </div>
        </div>

        {/* 3. Expiry Watchdog */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Expiry Risk SKUs (&lt;30 days)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            3 Items
          </div>
          <div className="text-[11px] font-medium text-rose-500">
            Dairy &amp; Bakery near expiry
          </div>
        </div>

        {/* 4. Wholesale Cartons */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
            <span>Wholesale Cartons in Stock</span>
            <Box className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            64 Cartons
          </div>
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            Wholesale inward sync active
          </div>
        </div>
      </div>

      {/* Two Column Grid: FMCG Staples & Expiry Watchdog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: FMCG Fast-Moving Staples */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Fast-Moving Grocery Staples &amp; Flour/Oil</span>
                <span className="text-[11px] text-slate-400">(تیز ترین سامان)</span>
              </h3>
              <p className="text-xs text-slate-500">High-turnover daily inventory requiring frequent supplier restock</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">FMCG Live</span>
          </div>

          <div className="space-y-3 pt-1">
            {fmcgStaples.map((f, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">{f.name}</span>
                  <span className="text-[10px] text-slate-500">{f.category} • Today: {f.dailyTurnover}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">{f.stock}</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Expiry Date Alert Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Expiry Date Watchdog</span>
              </h3>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full">
                Attention Required
              </span>
            </div>
            <p className="text-xs text-slate-500">Items nearing expiration dates to prevent financial write-offs</p>

            <div className="space-y-2.5 pt-1">
              {expiryWatchdog.map((e, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{e.item}</span>
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">{e.stock}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                    <span>⏳ {e.expiry}</span>
                    <span className="text-[10px] underline cursor-pointer hover:text-rose-900">Markdown Sale</span>
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

export default SupermartDashboard;
