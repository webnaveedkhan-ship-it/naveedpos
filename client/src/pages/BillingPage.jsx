import React, { useState, useEffect, useCallback } from 'react';
import { tenantService, backupService } from '../services/api';
import { formatCurrency } from '../utils/currency';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Smartphone,
  Send,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileText,
  BadgeAlert,
  Sparkles,
  Download,
  Lock,
  Layers,
  Users,
  Barcode,
  MessageSquare,
  Database,
  Scale,
} from 'lucide-react';

const PLANS_DATA = [
  {
    id: 'basic',
    name: 'Basic Plan',
    tagline: 'Starter for small retail shops',
    monthlyPrice: 1500,
    yearlyPrice: 15000,
    badge: null,
    borderClass: 'border-slate-200 dark:border-slate-800',
    headerBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    features: [
      { text: 'Max 300 Products Catalog', included: true },
      { text: 'Max 50 Customer Khata accounts', included: true },
      { text: 'Core POS Billing & 80mm Clean Receipts', included: true },
      { text: 'Daily & Weekly Sales Reports', included: true },
      { text: 'Manual Khata Ledger entry', included: true },
      { text: '1-Click WhatsApp Digital Receipts', included: false },
      { text: 'Printable Barcode Sticker Generator', included: false },
      { text: 'Day-End Cash Drawer Reconciliation', included: false },
      { text: 'Loose Weight & Fractional Pricing', included: false },
      { text: 'Full Store JSON Backup & Export', included: false },
    ],
  },
  {
    id: 'standard',
    name: 'Standard Plan',
    tagline: 'Most popular for growing grocery & marts',
    monthlyPrice: 3000,
    yearlyPrice: 30000,
    badge: 'Most Popular',
    borderClass: 'border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20',
    headerBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    features: [
      { text: 'Max 1,500 Products Catalog', included: true },
      { text: 'Unlimited Customer Khata accounts', included: true },
      { text: '1-Click WhatsApp Receipts & Reminders', included: true },
      { text: 'Printable Barcode Sticker Generator', included: true },
      { text: 'Daily, Weekly & Monthly Profit Reports', included: true },
      { text: 'Day-End Cash Drawer Reconciliation (حساب)', included: true },
      { text: 'Supplier Invoices & Wholesale Purchases', included: true },
      { text: 'Daily Store Expenses Manager', included: true },
      { text: 'Loose Weight & Fractional Pricing', included: false },
      { text: 'Full Store JSON Backup & Export', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium Supermart',
    tagline: 'Complete retail suite with unlimited capabilities',
    monthlyPrice: 5500,
    yearlyPrice: 55000,
    badge: 'All Unlocked',
    borderClass: 'border-emerald-500/70 shadow-lg shadow-emerald-500/10',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    features: [
      { text: 'Unlimited Products & Khata accounts', included: true },
      { text: 'All Standard Plan features included', included: true },
      { text: 'Loose Weight Fractional Pricing (Kg, Grams)', included: true },
      { text: 'One-Click Full Shop JSON Backup & Download', included: true },
      { text: 'Multi-Unit Carton/Wholesale Multipliers', included: true },
      { text: 'Unlimited Barcode Sticker Printing', included: true },
      { text: 'Complete Supplier Payables & Ledger', included: true },
      { text: 'Priority Super Admin VIP Support', included: true },
    ],
  },
];

const BillingPage = () => {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // Selected Plan for License Renewal
  const [selectedPlanId, setSelectedPlanId] = useState('standard');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Payment Form State
  const [method, setMethod] = useState('JAZZCASH');
  const [amount, setAmount] = useState('3000');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tenantService.getMyBilling();
      if (res.data?.success) {
        setBillingData(res.data.billing);
        if (res.data.billing.plan && res.data.billing.plan !== 'trial') {
          setSelectedPlanId(res.data.billing.plan);
        }
      }
    } catch (err) {
      console.error('Failed to load store billing info:', err);
      setErrorMsg(err.response?.data?.message || 'Could not load subscription details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  // Synchronize amount when selected plan or cycle changes
  useEffect(() => {
    const planObj = PLANS_DATA.find((p) => p.id === selectedPlanId) || PLANS_DATA[1];
    const price = billingCycle === 'yearly' ? planObj.yearlyPrice : planObj.monthlyPrice;
    setAmount(String(price));
  }, [selectedPlanId, billingCycle]);

  const handleDownloadBackup = async () => {
    try {
      setIsExportingBackup(true);
      setErrorMsg('');
      const res = await backupService.downloadBackup();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `naveedpos-${billingData?.slug || 'store'}-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMsg('Store database backup downloaded successfully.');
    } catch (err) {
      console.error('Backup download failed:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Backup download failed. Full store backup is available on Premium Supermart plan.'
      );
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!transactionId.trim()) {
      setErrorMsg('Please enter your Transaction Reference ID (TID).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await tenantService.submitPayment({
        amount: Number(amount),
        billingCycle,
        paymentMethod: method,
        transactionId: transactionId.trim(),
        receiptUrl: receiptUrl.trim(),
        targetPlan: selectedPlanId,
      });

      setSuccessMsg(
        res.data.message ||
          'Payment proof submitted! Super Admin (Naveed) will verify and update your store limits.'
      );
      setTransactionId('');
      setReceiptUrl('');
      fetchBilling();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit payment verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="text-center animate-fade-in-scale">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading store subscription & plan limits...</p>
        </div>
      </div>
    );
  }

  const {
    storeName = 'My Store',
    status = 'active',
    plan = 'trial',
    planLimits = {},
    usage = {},
    subscriptionExpiresAt,
    daysRemaining = 0,
    isExpired = false,
    payments = [],
  } = billingData || {};

  const expiryDate = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
  const currentProducts = usage.productsCount || 0;
  const maxProducts = planLimits.maxProducts || 300;
  const isProductsUnlimited = maxProducts >= 999999;
  const productsPct = isProductsUnlimited
    ? 15
    : Math.min(100, Math.round((currentProducts / maxProducts) * 100));

  const currentKhata = usage.khataCustomersCount || 0;
  const maxKhata = planLimits.maxKhataCustomers || 50;
  const isKhataUnlimited = maxKhata >= 999999;
  const khataPct = isKhataUnlimited
    ? 20
    : Math.min(100, Math.round((currentKhata / maxKhata) * 100));

  const canDownloadBackup = planLimits.allowBackupExport ?? false;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              SaaS Billing & Subscriptions
            </span>
            <span className="text-xs text-slate-400">Store: {storeName}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Store Subscription & Plan Limits</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your NaveedPOS commercial retail license, track catalog quotas, and renew via Pakistani payment rails.
          </p>
        </div>

        {/* Full Store Backup Action */}
        <div>
          {canDownloadBackup ? (
            <button
              onClick={handleDownloadBackup}
              disabled={isExportingBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
              title="Download entire catalog, orders, khata ledgers, and expenses as JSON snapshot"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{isExportingBackup ? 'Preparing Backup...' : 'Download Full Shop Backup'}</span>
            </button>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-medium cursor-not-allowed border border-slate-200 dark:border-slate-700"
              title="Full JSON backup download is unlocked on the Premium Supermart plan"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Shop Backup (Premium Plan)</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active License Status Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-xs transition ${
          isExpired
            ? 'bg-red-500/10 border-red-500/30'
            : status === 'trial'
            ? 'bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-indigo-500/10 border-emerald-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isExpired
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200'
                    : status === 'trial'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                }`}
              >
                {isExpired ? 'License Expired' : status === 'trial' ? '14-Day Free Trial' : `${plan.toUpperCase()} Plan Active`}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Status: <strong className="uppercase">{status}</strong>
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {isExpired
                ? 'Your NaveedPOS Subscription Has Expired'
                : status === 'trial'
                ? `You Have ${daysRemaining} Days Remaining in Your Free Trial`
                : `${daysRemaining} Days of Licensed Access Remaining`}
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Valid until:{' '}
                <strong>
                  {expiryDate
                    ? expiryDate.toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Lifetime'}
                </strong>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block">
                {daysRemaining}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Days Left
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Usage & Quotas Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Products Quota */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Product Catalog Quota</h3>
                <p className="text-[11px] text-slate-400">Total products added to store inventory</p>
              </div>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {currentProducts} / {isProductsUnlimited ? 'Unlimited' : maxProducts}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                productsPct > 90 ? 'bg-rose-500' : productsPct > 70 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${productsPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{isProductsUnlimited ? 'Unlimited SKU Capacity' : `${maxProducts - currentProducts} slots available`}</span>
            <span>{isProductsUnlimited ? 'Premium' : `${productsPct}% used`}</span>
          </div>
        </div>

        {/* Khata Customers Quota */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Customer Khata Ledger Quota</h3>
                <p className="text-[11px] text-slate-400">Customer accounts with credit ledgers</p>
              </div>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {currentKhata} / {isKhataUnlimited ? 'Unlimited' : maxKhata}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                khataPct > 90 ? 'bg-rose-500' : khataPct > 70 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${khataPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{isKhataUnlimited ? 'Unlimited Customer Ledgers' : `${maxKhata - currentKhata} customer slots left`}</span>
            <span>{isKhataUnlimited ? 'Standard/Premium' : `${khataPct}% used`}</span>
          </div>
        </div>
      </div>

      {/* 3-Tier SaaS Commercial Pricing Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Choose Your Retail Subscription Plan</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select the plan that fits your retail store size and submit renewal verification below.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.2 bg-amber-500 text-[9px] text-slate-950 font-black rounded-full">
                2 Mo Free
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS_DATA.map((p) => {
            const isSelected = selectedPlanId === p.id;
            const price = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`p-6 rounded-3xl border-2 bg-white dark:bg-slate-900 cursor-pointer transition-all relative flex flex-col justify-between ${
                  p.borderClass
                } ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}
              >
                {p.badge && (
                  <div className="absolute -top-3 right-6">
                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                      {p.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {p.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-5">{p.tagline}</p>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800 py-3 space-y-2 mb-4">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 pt-2 text-xs">
                        {f.included ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] text-slate-400">
                            ✕
                          </div>
                        )}
                        <span
                          className={
                            f.included
                              ? 'text-slate-700 dark:text-slate-200 font-medium'
                              : 'text-slate-400 dark:text-slate-600 line-through'
                          }
                        >
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{isSelected ? 'Selected for Payment' : 'Choose This Plan'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Pakistani Payment Accounts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Official Payment Accounts (Transfer / JazzCash / EasyPaisa)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Transfer your subscription fee to any of the following accounts, then enter your Transaction ID (TID) below:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Meezan Bank */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Meezan Bank Limited</span>
            </div>
            <div className="text-[11px] text-slate-500">Title: <strong>Naveed Ahmed</strong></div>
            <div className="text-[11px] text-slate-500 font-mono">A/C: <strong>02010108976543</strong></div>
            <div className="text-[10px] text-slate-400 font-mono">IBAN: PK64MEZN0002010108976543</div>
          </div>

          {/* JazzCash */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Smartphone className="w-4 h-4 text-red-600" />
              <span>JazzCash Wallet</span>
            </div>
            <div className="text-[11px] text-slate-500">Account: <strong>0300-1234567</strong></div>
            <div className="text-[11px] text-slate-500">Title: <strong>Naveed Ahmed</strong></div>
            <div className="text-[10px] text-slate-400">Instant App or Retailer Transfer</div>
          </div>

          {/* EasyPaisa */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>EasyPaisa Wallet</span>
            </div>
            <div className="text-[11px] text-slate-500">Account: <strong>0333-7654321</strong></div>
            <div className="text-[11px] text-slate-500">Title: <strong>Naveed Ahmed</strong></div>
            <div className="text-[10px] text-slate-400">Instant App or Retailer Transfer</div>
          </div>
        </div>
      </div>

      {/* Payment Verification Submission Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Send className="w-4 h-4 text-emerald-600" />
          <span>Submit Payment Verification Proof for Approval</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Once you have sent the payment via Bank / JazzCash / EasyPaisa, enter your transaction reference below:
        </p>

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Selected Plan
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              >
                <option value="basic">Basic Plan (Rs. 1,500/mo)</option>
                <option value="standard">Standard Plan (Rs. 3,000/mo)</option>
                <option value="premium">Premium Supermart (Rs. 5,500/mo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method Used *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
              >
                <option value="JAZZCASH">JazzCash (0300-1234567)</option>
                <option value="EASYPAISA">EasyPaisa (0333-7654321)</option>
                <option value="BANK_TRANSFER">Meezan Bank (PK64MEZN...)</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount Paid (PKR) *
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction ID (TID) *
              </label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. TID 987654321 or Bank Ref"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Receipt Screenshot / Proof Link (Optional)
            </label>
            <input
              type="text"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="Paste screenshot URL or leave blank"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting Verification...</span>
              ) : (
                <>
                  <span>Submit Payment Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Payment History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Payment Submissions History</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No payment submissions yet. Transfer and submit your TID above to extend your license.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-slate-700 dark:text-slate-300">
                        {p.billingCycle}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {p.transactionId}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : p.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          {p.status === 'pending' ? '⏳ Under Review' : p.status}
                        </span>
                        {p.rejectionReason && (
                          <div className="text-[10px] text-red-500 mt-0.5">{p.rejectionReason}</div>
                        )}
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

export default BillingPage;
