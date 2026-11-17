import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Save,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';

const initialIndustryPlans = {
  FOOTWEAR: [
    {
      id: 'footwear_starter',
      name: 'Footwear Single Outlet',
      urdu: 'جوتے سنگل شاپ پیکج',
      badge: 'Starter',
      monthlyPrice: 1800,
      annualPrice: 18000,
      maxProducts: 600,
      dailyBills: 150,
      maxUsers: 2,
      description: 'Ideal for small shoe shops, chappal stalls & bazaar counters with size 6-11 matrix.',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
      buttonColor: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    {
      id: 'footwear_pro',
      name: 'Shoe Mart & Boutique Pro',
      urdu: 'شو مارٹ اور بوٹیک پرو',
      badge: 'Most Popular',
      monthlyPrice: 3500,
      annualPrice: 35000,
      maxProducts: 3000,
      dailyBills: 600,
      maxUsers: 5,
      description: 'High-volume footwear showrooms, broken size run auto-alerts, and brand turnover tracking.',
      color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30',
      buttonColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
    },
    {
      id: 'footwear_enterprise',
      name: 'Footwear Chain & Factory',
      urdu: 'جوتے ہول سیل اور فیکٹری چین',
      badge: 'Enterprise',
      monthlyPrice: 6200,
      annualPrice: 62000,
      maxProducts: 99999,
      dailyBills: 99999,
      maxUsers: 999,
      description: 'Shoe factories, carton packers, multi-counter and wholesale cash & carry footwear chains.',
      color: 'from-amber-600/20 to-rose-500/20 border-amber-600/40 text-amber-400',
      buttonColor: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
  ],
  GARMENTS: [
    {
      id: 'garments_starter',
      name: 'Single Boutique',
      urdu: 'سنگل بوتیک پیکج',
      badge: 'Boutique Tier',
      monthlyPrice: 2000,
      annualPrice: 20000,
      maxProducts: 800,
      dailyBills: 150,
      maxUsers: 2,
      description: 'Ladies boutiques, tailor shops, and apparel stores with sizes S, M, L, XL, XXL.',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400',
      buttonColor: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
    {
      id: 'garments_pro',
      name: 'Fashion Outlet & Tailoring Pro',
      urdu: 'فیشن آؤٹ لیٹ اور ٹیلرنگ ماسٹر',
      badge: 'Most Popular',
      monthlyPrice: 3800,
      annualPrice: 38000,
      maxProducts: 4000,
      dailyBills: 800,
      maxUsers: 8,
      description: 'Alteration queue tracking, clothing hang-tag barcode printing, and seasonal lawn collections.',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/60 text-blue-300 ring-1 ring-blue-500/30',
      buttonColor: 'bg-blue-500 hover:bg-blue-400 text-slate-950 font-black',
    },
    {
      id: 'garments_enterprise',
      name: 'Garments Department Store',
      urdu: 'گارمنٹس میگا شو روم چین',
      badge: 'Enterprise',
      monthlyPrice: 6800,
      annualPrice: 68000,
      maxProducts: 99999,
      dailyBills: 99999,
      maxUsers: 999,
      description: 'Multi-floor fashion showrooms, bridal houses, and master tailoring workshop operations.',
      color: 'from-indigo-600/20 to-purple-500/20 border-indigo-600/40 text-indigo-400',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    },
  ],
  GENERAL_STORE: [
    {
      id: 'supermart_starter',
      name: 'Neighborhood Kiryana',
      urdu: 'کریانہ و جنرل اسٹور',
      badge: 'Corner Shop',
      monthlyPrice: 1500,
      annualPrice: 15000,
      maxProducts: 400,
      dailyBills: 100,
      maxUsers: 2,
      description: 'Corner Kiryana store with loose scales (Kg/Grams) and Customer Khata Udhar book.',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    {
      id: 'supermart_pro',
      name: 'Supermarket Standard',
      urdu: 'ماڈرن سپر مارکیٹ اسٹینڈرڈ',
      badge: 'Most Popular',
      monthlyPrice: 3200,
      annualPrice: 32000,
      maxProducts: 3500,
      dailyBills: 1000,
      maxUsers: 6,
      description: 'Sub-second barcode terminal, expiry watchdog (<30 days), and carton unboxing.',
      color: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30',
      buttonColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
    },
    {
      id: 'supermart_enterprise',
      name: 'Mega Mart / Cash & Carry',
      urdu: 'میگا کیش اینڈ کیری ہائپر مارٹ',
      badge: 'Enterprise',
      monthlyPrice: 5800,
      annualPrice: 58000,
      maxProducts: 99999,
      dailyBills: 99999,
      maxUsers: 999,
      description: 'Multi-lane barcode checkout, supplier GRN payables, and high-volume warehouse replenishment.',
      color: 'from-emerald-600/20 to-blue-500/20 border-emerald-600/40 text-emerald-400',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
  ],
  PERFUME: [
    {
      id: 'perfume_starter',
      name: 'Attar & Fragrance Kiosk',
      urdu: 'عطر و پرفیوم اسٹال پیکج',
      badge: 'Fragrance Kiosk',
      monthlyPrice: 1800,
      annualPrice: 18000,
      maxProducts: 500,
      dailyBills: 120,
      maxUsers: 2,
      description: 'Mall fragrance kiosk, traditional Ittar shop, with precision ML & Tola volume dispensing.',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-400',
      buttonColor: 'bg-purple-600 hover:bg-purple-500 text-white',
    },
    {
      id: 'perfume_pro',
      name: 'Luxury Perfumery House',
      urdu: 'لگژری پرفیوم اور عطر ہاؤس',
      badge: 'Most Popular',
      monthlyPrice: 3600,
      annualPrice: 36000,
      maxProducts: 3000,
      dailyBills: 600,
      maxUsers: 5,
      description: 'Tester spray vs sold bottle ROI conversion auditor and bespoke client formula recipe vault.',
      color: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/60 text-purple-300 ring-1 ring-purple-500/30',
      buttonColor: 'bg-purple-500 hover:bg-purple-400 text-slate-950 font-black',
    },
    {
      id: 'perfume_enterprise',
      name: 'Attar Chain & Manufacturer',
      urdu: 'عطر فیکٹری اور برانڈڈ پرفیوم چین',
      badge: 'Enterprise',
      monthlyPrice: 6500,
      annualPrice: 65000,
      maxProducts: 99999,
      dailyBills: 99999,
      maxUsers: 999,
      description: 'Bulk perfume oil drum inventory, wholesale tola packing, and centralized blend formulations.',
      color: 'from-purple-600/20 to-indigo-500/20 border-purple-600/40 text-purple-400',
      buttonColor: 'bg-purple-600 hover:bg-purple-500 text-white',
    },
  ],
};

const industryMetadata = [
  { id: 'FOOTWEAR', label: 'Footwear & Shoes', icon: '👟' },
  { id: 'GARMENTS', label: 'Garments & Boutique', icon: '👕' },
  { id: 'GENERAL_STORE', label: 'Supermart & Kiryana', icon: '🛒' },
  { id: 'PERFUME', label: 'Perfumery & Attar', icon: '🧪' },
];

const PlansAndPricing = () => {
  const [activeModule, setActiveModule] = useState('FOOTWEAR');
  const [plansByModule, setPlansByModule] = useState(initialIndustryPlans);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentPlans = plansByModule[activeModule] || plansByModule.GENERAL_STORE;

  const handlePriceChange = (id, field, value) => {
    setPlansByModule((prev) => ({
      ...prev,
      [activeModule]: prev[activeModule].map((plan) =>
        plan.id === id ? { ...plan, [field]: Number(value) || 0 } : plan
      ),
    }));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-white tracking-tight">SaaS Subscription Plans &amp; Pricing</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full">
              PKR Currency
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure monthly and annual subscription rates, inventory quotas, and limits tailored per Pakistani retail sector.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-[0.97] transition min-h-[44px]"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Plan Changes</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Industry Vertical Selector Tabs */}
      <div className="flex items-center p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl gap-1.5 overflow-x-auto">
        {industryMetadata.map((ind) => {
          const isSel = activeModule === ind.id;
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => setActiveModule(ind.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap active:scale-95 ${
                isSel
                  ? 'bg-brand-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{ind.icon}</span>
              <span>{ind.label}</span>
            </button>
          );
        })}
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {currentPlans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition relative overflow-hidden ${plan.color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
                  {plan.badge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Tier ID: {plan.id}</span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight">{plan.name}</h3>
              {plan.urdu && (
                <p className="text-xs font-bold text-emerald-400 mb-2 font-sans" dir="rtl">
                  {plan.urdu}
                </p>
              )}
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{plan.description}</p>

              {/* Price Inputs */}
              <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Monthly Fee (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-500">
                      Rs.
                    </span>
                    <input
                      type="number"
                      value={plan.monthlyPrice}
                      onChange={(e) => handlePriceChange(plan.id, 'monthlyPrice', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-500 min-h-[40px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Annual Fee (PKR - 2 Months Free)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-500">
                      Rs.
                    </span>
                    <input
                      type="number"
                      value={plan.annualPrice}
                      onChange={(e) => handlePriceChange(plan.id, 'annualPrice', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-500 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Limits */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800">
                  <span>Max Products</span>
                  <span className="font-bold text-white">
                    {plan.maxProducts >= 99999 ? 'Unlimited' : `${plan.maxProducts.toLocaleString()} SKUs`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800">
                  <span>Daily Billing Receipts</span>
                  <span className="font-bold text-white">
                    {plan.dailyBills >= 99999 ? 'Unlimited' : `${plan.dailyBills} Bills / Day`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800">
                  <span>Cashier Staff Logins</span>
                  <span className="font-bold text-white">{plan.maxUsers >= 999 ? 'Unlimited' : `${plan.maxUsers} Users`}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800">
                  <span>Industry Specialized Module</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full Access
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1">
                  <span>WhatsApp Digital Receipts</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Included
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`w-full mt-5 py-2.5 rounded-xl font-bold text-xs transition active:scale-[0.98] min-h-[44px] flex items-center justify-center space-x-1.5 ${plan.buttonColor}`}
            >
              <span>Update {plan.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansAndPricing;
