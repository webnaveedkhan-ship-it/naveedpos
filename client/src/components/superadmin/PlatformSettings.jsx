import React, { useState } from 'react';
import {
  Settings,
  CreditCard,
  Phone,
  ShieldCheck,
  Save,
  Check,
  Building,
  Smartphone,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    jazzCashNumber: '0300-1234567',
    jazzCashTitle: 'Naveed Khan',
    easyPaisaNumber: '0345-7654321',
    easyPaisaTitle: 'Naveed Khan',
    bankName: 'Meezan Bank Ltd.',
    bankAccountTitle: 'Naveed Technologies Pvt Ltd',
    bankIban: 'PK82MEZN0001234567890123',
    defaultTrialDays: '14',
    supportPhone: '+92 300 0000000',
    supportEmail: 'support@naveedpos.com',
    allowPublicSignup: true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-white tracking-tight">Platform SaaS Configuration</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full">
              Global Platform
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure receiving payment wallets (JazzCash, EasyPaisa, Bank IBFT) shown to store owners during subscription renewal.
          </p>
        </div>

        <button
          type="submit"
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
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Payment Wallets & Receiving Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Mobile Wallets (JazzCash & EasyPaisa) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">Mobile Wallets (JazzCash &amp; EasyPaisa)</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                JazzCash Receiving Account Number
              </label>
              <input
                type="text"
                value={settings.jazzCashNumber}
                onChange={(e) => handleChange('jazzCashNumber', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                JazzCash Account Title
              </label>
              <input
                type="text"
                value={settings.jazzCashTitle}
                onChange={(e) => handleChange('jazzCashTitle', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                EasyPaisa Receiving Account Number
              </label>
              <input
                type="text"
                value={settings.easyPaisaNumber}
                onChange={(e) => handleChange('easyPaisaNumber', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                EasyPaisa Account Title
              </label>
              <input
                type="text"
                value={settings.easyPaisaTitle}
                onChange={(e) => handleChange('easyPaisaTitle', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Bank Account IBFT & Support Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Building className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black text-white">Bank Account Transfer (IBFT)</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Account Title / Business Name
              </label>
              <input
                type="text"
                value={settings.bankAccountTitle}
                onChange={(e) => handleChange('bankAccountTitle', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                IBAN Number
              </label>
              <input
                type="text"
                value={settings.bankIban}
                onChange={(e) => handleChange('bankIban', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Merchant Support Helpline
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlatformSettings;
