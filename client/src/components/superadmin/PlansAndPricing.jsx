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

const initialPlans = [
  {
    id: 'trial',
    name: '14-Day Free Trial',
    badge: 'Onboarding Tier',
    monthlyPrice: 0,
    annualPrice: 0,
    maxProducts: 200,
    dailyBills: 50,
    maxUsers: 2,
    allowBarcodeGen: true,
    allowWhatsApp: true,
    allowDrawerReconciliation: true,
    description: 'Automatic 14-day trial for new shop registrations with zero upfront credit card.',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
    buttonColor: 'bg-amber-600 hover:bg-amber-500 text-white',
  },
  {
    id: 'standard',
    name: 'Standard Retailer',
    badge: 'Most Popular',
    monthlyPrice: 3000,
    annualPrice: 30000,
    maxProducts: 1500,
    dailyBills: 500,
    maxUsers: 5,
    allowBarcodeGen: true,
    allowWhatsApp: true,
    allowDrawerReconciliation: true,
    description: 'Designed for retail grocery, garments, cosmetics, and electronics marts in Pakistan.',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
  {
    id: 'premium',
    name: 'Premium Enterprise',
    badge: 'Unlimited Fleet',
    monthlyPrice: 6000,
    annualPrice: 60000,
    maxProducts: 99999,
    dailyBills: 99999,
    maxUsers: 999,
    allowBarcodeGen: true,
    allowWhatsApp: true,
    allowDrawerReconciliation: true,
    description: 'High-volume supermarkets, pharmacy chains, and wholesale cash-and-carry businesses.',
    color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-400',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  },
];

const PlansAndPricing = () => {
  const [plans, setPlans] = useState(initialPlans);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handlePriceChange = (id, field, value) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, [field]: Number(value) || 0 } : plan
      )
    );
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
            Configure monthly and annual subscription rates, inventory limits, and feature permissions for store tenants.
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

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition relative overflow-hidden ${plan.color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
                  {plan.badge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Tier ID: {plan.id}</span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight mb-1">{plan.name}</h3>
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
                  <span>Thermal Barcode Generator</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Included
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
