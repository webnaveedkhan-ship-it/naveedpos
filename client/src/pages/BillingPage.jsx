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

const MODULE_PLANS_DATA = {
  FOOTWEAR: {
    id: 'FOOTWEAR',
    title: 'Footwear & Shoe Mart Plans',
    urdu: 'جوتے، سینڈلز اور چپل اسٹور کے لیے خصوصی پیکجز',
    icon: '👟',
    plans: [
      {
        id: 'footwear_starter',
        name: 'Footwear Single Outlet',
        urdu: 'جوتے سنگل شاپ پیکج',
        tagline: 'Ideal for small shoe shops, chappal stalls & bazaar counters',
        monthlyPrice: 1800,
        yearlyPrice: 18000,
        badge: 'Starter',
        borderClass: 'border-amber-500/40',
        headerBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200',
        features: [
          { text: 'Pakistani Sizes 6 to 11 Matrix Run', included: true },
          { text: 'Max 600 Shoe Models & Pairs', included: true },
          { text: 'Single POS Counter Billing & Thermal Slip', included: true },
          { text: 'Shoe Box Barcode Sticker Generator', included: true },
          { text: '1-Click WhatsApp Shoe Sale Bill', included: true },
          { text: 'Broken Size Run Auto-Alerts', included: false },
          { text: 'Brand Turnover Analytics (Bata/Service)', included: false },
          { text: 'Multi-Branch Inventory Sync', included: false },
        ],
      },
      {
        id: 'footwear_pro',
        name: 'Shoe Mart & Boutique Pro',
        urdu: 'شو مارٹ اور بوٹیک پرو',
        tagline: 'High-volume footwear showrooms, malls, and brand retailers',
        monthlyPrice: 3500,
        yearlyPrice: 35000,
        badge: 'Most Popular',
        popular: true,
        borderClass: 'border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20',
        headerBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
        features: [
          { text: 'Pakistani Sizes 6 to 11 Matrix Run', included: true },
          { text: 'Max 3,000 Shoe Models & Pairs', included: true },
          { text: 'Broken Size Run Auto-Alerts (Critical 7, 8, 9)', included: true },
          { text: 'Brand Turnover Analytics (Bata, Service, Peshawari Kheri)', included: true },
          { text: 'Shoe Box Barcodes + Shoe Exchange / Return Slip', included: true },
          { text: 'Day-End Cash Drawer (Sham ka Hisaab)', included: true },
          { text: 'Customer Khata Udhar Book with WhatsApp Reminders', included: true },
          { text: 'Multi-Branch Inventory Sync', included: false },
        ],
      },
      {
        id: 'footwear_enterprise',
        name: 'Footwear Chain & Factory',
        urdu: 'جوتے ہول سیل اور فیکٹری چین',
        tagline: 'Shoe factories, wholesale carton distributors & showroom chains',
        monthlyPrice: 6200,
        yearlyPrice: 62000,
        badge: 'Enterprise',
        borderClass: 'border-amber-600 shadow-xl shadow-amber-500/20',
        headerBg: 'bg-amber-600/10 text-amber-600 dark:text-amber-400',
        features: [
          { text: 'Unlimited Shoe Models & Pairs', included: true },
          { text: 'Wholesale Carton-to-Pair Unboxing Multipliers', included: true },
          { text: 'Broken Size Watchdog with Automatic Reordering', included: true },
          { text: 'Multi-Counter & Multi-Branch Cloud Sync', included: true },
          { text: 'Master Factory Khata & Supplier Payables', included: true },
          { text: 'Full Automated Database Backup & JSON Download', included: true },
          { text: 'Priority Super Admin VIP Support 24/7', included: true },
        ],
      },
    ],
  },
  GARMENTS: {
    id: 'GARMENTS',
    title: 'Garments & Boutique Plans',
    urdu: 'گارمنٹس، بوتیک اور شلوار قمیض کے لیے پیکجز',
    icon: '👕',
    plans: [
      {
        id: 'garments_starter',
        name: 'Single Boutique',
        urdu: 'سنگل بوتیک پیکج',
        tagline: 'Neighborhood ladies boutique, tailor shop, or kurta kiosk',
        monthlyPrice: 2000,
        yearlyPrice: 20000,
        badge: 'Boutique Tier',
        borderClass: 'border-blue-500/40',
        headerBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200',
        features: [
          { text: 'Apparel Sizes S, M, L, XL, XXL Run Matrix', included: true },
          { text: 'Boutique Clothing Hang-Tag Barcode Printing', included: true },
          { text: 'Max 800 Garment Items & Suits', included: true },
          { text: 'WhatsApp Digital Bill & Fitting Notes', included: true },
          { text: 'Customer Khata Udhar Book', included: true },
          { text: 'Alteration & Tailoring Workshop Queue', included: false },
          { text: 'Seasonal Collection Margin Analytics', included: false },
          { text: 'Designer Consignment Management', included: false },
        ],
      },
      {
        id: 'garments_pro',
        name: 'Fashion Outlet & Tailoring Pro',
        urdu: 'فیشن آؤٹ لیٹ اور ٹیلرنگ ماسٹر',
        tagline: 'Busy apparel stores, lawn centers & bridal boutiques',
        monthlyPrice: 3800,
        yearlyPrice: 38000,
        badge: 'Most Popular',
        popular: true,
        borderClass: 'border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20',
        headerBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
        features: [
          { text: 'Apparel Sizes S to XXL Matrix + Color Variants', included: true },
          { text: 'Alteration & Tailoring Queue with Pickup Date Alerts', included: true },
          { text: 'Seasonal Lawn 3pc, Shawls & Kurta Collection Tracker', included: true },
          { text: 'Custom Clothing Hang-Tags with Wash Care & SKU', included: true },
          { text: 'WhatsApp Fitting Ready & Due Balance Alerts', included: true },
          { text: 'Day-End Cash Drawer (Sham ka Hisaab)', included: true },
          { text: 'Store Expense & Fabric Purchase Ledger', included: true },
          { text: 'Designer Consignment Management', included: false },
        ],
      },
      {
        id: 'garments_enterprise',
        name: 'Garments Department Store',
        urdu: 'گارمنٹس میگا شو روم چین',
        tagline: 'Multi-floor fashion showrooms, apparel chains & bridal houses',
        monthlyPrice: 6800,
        yearlyPrice: 68000,
        badge: 'Enterprise',
        borderClass: 'border-blue-600 shadow-xl shadow-blue-500/20',
        headerBg: 'bg-blue-600/10 text-blue-600 dark:text-blue-400',
        features: [
          { text: 'Unlimited Garments, Fabrics & Stitched Suites', included: true },
          { text: 'Master Tailoring Workshop Ledger with Multi-Master Tracking', included: true },
          { text: 'Designer Consignment Payouts & Commission Tracking', included: true },
          { text: 'Multi-Floor & Multi-Counter Fast POS Terminals', included: true },
          { text: 'Seasonal Collection Clearance Margin Maximizer', included: true },
          { text: 'Full Shop Backup & Automated Daily Exports', included: true },
          { text: 'VIP Dedicated 24/7 Phone & WhatsApp Support', included: true },
        ],
      },
    ],
  },
  GENERAL_STORE: {
    id: 'GENERAL_STORE',
    title: 'Supermart & Kiryana Plans',
    urdu: 'سپر مارٹ، کریانہ اور ڈیپارٹمنٹل اسٹور کے لیے پیکجز',
    icon: '🛒',
    plans: [
      {
        id: 'supermart_starter',
        name: 'Neighborhood Kiryana',
        urdu: 'کریانہ و جنرل اسٹور',
        tagline: 'Local Kiryana, corner grocery shop, or fruit & veg mart',
        monthlyPrice: 1500,
        yearlyPrice: 15000,
        badge: 'Corner Shop',
        borderClass: 'border-emerald-500/40',
        headerBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200',
        features: [
          { text: 'Fast Loose Weight Scale Billing (Kg, Grams, Dozen)', included: true },
          { text: 'Customer Khata Udhar Book with Balances', included: true },
          { text: 'Max 400 FMCG Grocery Items', included: true },
          { text: '80mm Thermal Receipt Generator (Zero Tax)', included: true },
          { text: 'Sub-Second Barcode Scanner Checkout', included: false },
          { text: 'Expiry Date Watchdog (<30 Days)', included: false },
          { text: 'Wholesale Carton Unboxing Multipliers', included: false },
          { text: 'Supplier Invoices & Payables', included: false },
        ],
      },
      {
        id: 'supermart_pro',
        name: 'Supermarket Standard',
        urdu: 'ماڈرن سپر مارکیٹ اسٹینڈرڈ',
        tagline: 'Modern grocery marts, mini-marts, and departmental stores',
        monthlyPrice: 3200,
        yearlyPrice: 32000,
        badge: 'Most Popular',
        popular: true,
        borderClass: 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20',
        headerBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        features: [
          { text: 'Sub-Second Barcode Scanner Checkout Terminal', included: true },
          { text: 'Expiry Date Watchdog (<30 Days Alert for Dairy/Bread)', included: true },
          { text: 'Loose Weight Scales + FMCG Packets Combined', included: true },
          { text: 'Wholesale Carton Unboxing into Shelf Units', included: true },
          { text: '1-Click WhatsApp Bills & Khata Udhar Reminders', included: true },
          { text: 'Printable Product Barcode Stickers (Thermal & A4)', included: true },
          { text: 'Day-End Cash Drawer (حساب) Reconciliation', included: true },
          { text: 'Daily Store Expenses & Supplier Payables', included: true },
        ],
      },
      {
        id: 'supermart_enterprise',
        name: 'Mega Mart / Cash & Carry',
        urdu: 'میگا کیش اینڈ کیری ہائپر مارٹ',
        tagline: 'High-volume hypermarkets, wholesale cash & carry chains',
        monthlyPrice: 5800,
        yearlyPrice: 58000,
        badge: 'Enterprise',
        borderClass: 'border-emerald-600 shadow-xl shadow-emerald-500/20',
        headerBg: 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400',
        features: [
          { text: 'Unlimited FMCG Products, Barcodes & Aisles', included: true },
          { text: 'Multi-Lane High-Speed Barcode Cashier Terminals', included: true },
          { text: 'Advanced Expiry Management with Supplier Return Logs', included: true },
          { text: 'Pallet / Wholesale Tiered Price Multipliers', included: true },
          { text: 'Full Supplier Ledger & Goods Received Notes (GRN)', included: true },
          { text: 'Full Shop Cloud JSON Backup & Data Export', included: true },
          { text: 'VIP Dedicated 24/7 Super Admin Support Hotline', included: true },
        ],
      },
    ],
  },
  PERFUME: {
    id: 'PERFUME',
    title: 'Perfumery & Attar Plans',
    urdu: 'عطر، خوشبو اور پرفیوم شاپ کے لیے پیکجز',
    icon: '🧪',
    plans: [
      {
        id: 'perfume_starter',
        name: 'Attar & Fragrance Kiosk',
        urdu: 'عطر و پرفیوم اسٹال پیکج',
        tagline: 'Mall fragrance kiosk, traditional Ittar shop, or decant counter',
        monthlyPrice: 1800,
        yearlyPrice: 18000,
        badge: 'Fragrance Kiosk',
        borderClass: 'border-purple-500/40',
        headerBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200',
        features: [
          { text: 'Precision ML & Tola Dispensing (12ml, 6ml, 3ml)', included: true },
          { text: 'Max 500 Fragrance Oils & Tester Bottles', included: true },
          { text: 'Single POS Counter for Quick Decants', included: true },
          { text: 'Customer Khata Udhar Book with Balances', included: true },
          { text: 'WhatsApp Digital Bill with Scent Profile', included: true },
          { text: 'Tester Spray Conversion & Depletion Auditor', included: false },
          { text: 'Custom Scent Blend & Oil Formulation Vault', included: false },
          { text: 'Concentrated Oil Drum Inventory', included: false },
        ],
      },
      {
        id: 'perfume_pro',
        name: 'Luxury Perfumery House',
        urdu: 'لگژری پرفیوم اور عطر ہاؤس',
        tagline: 'High-end perfume stores, bespoke perfumers & Arabian Oud houses',
        monthlyPrice: 3600,
        yearlyPrice: 36000,
        badge: 'Most Popular',
        popular: true,
        borderClass: 'border-purple-500 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/20',
        headerBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
        features: [
          { text: 'Precision ML, Tola & Spray Decant Dispensing Engine', included: true },
          { text: 'Tester Spray vs Sold Bottle Conversion Auditor (ROI)', included: true },
          { text: 'Custom Blend Formulation Vault (Client Scent Recipes)', included: true },
          { text: 'Fragrance Note Families (Dehn Al Oud, Musk, Amber, Citrus)', included: true },
          { text: 'Bottle & Cap Packaging Inventory Tracking', included: true },
          { text: 'Day-End Cash Drawer (Sham ka Hisaab)', included: true },
          { text: 'WhatsApp Scent Cards with Notes & Dilution Details', included: true },
          { text: 'Concentrated Oil Drum Inventory', included: false },
        ],
      },
      {
        id: 'perfume_enterprise',
        name: 'Attar Chain & Manufacturer',
        urdu: 'عطر فیکٹری اور برانڈڈ پرفیوم چین',
        tagline: 'Bulk perfume oil importers, distributors & retail chains',
        monthlyPrice: 6500,
        yearlyPrice: 65000,
        badge: 'Enterprise',
        borderClass: 'border-purple-600 shadow-xl shadow-purple-500/20',
        headerBg: 'bg-purple-600/10 text-purple-600 dark:text-purple-400',
        features: [
          { text: 'Unlimited Fragrance Oils, Flacons & Decants', included: true },
          { text: 'Concentrated Pure Oil Drum (KG / Liters) Batch Master', included: true },
          { text: 'Private Label Blend Recipes with Exact Cost Breakdown', included: true },
          { text: 'Wholesale Tola Packing & Export Documentation', included: true },
          { text: 'Multi-Kiosk & Multi-Branch Central Oil Master', included: true },
          { text: 'Full Shop Backup & Automated Daily Formula Exports', included: true },
          { text: 'VIP Dedicated 24/7 Super Admin Support Hotline', included: true },
        ],
      },
    ],
  },
};

const BillingPage = () => {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // Active Industry Vertical Selector for Specialized Plans
  const [activeIndustryTab, setActiveIndustryTab] = useState(() => {
    return localStorage.getItem('naveedpos_business_type') || 'GENERAL_STORE';
  });

  // Selected Plan for License Renewal
  const [selectedPlanId, setSelectedPlanId] = useState('supermart_pro');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Payment Form State
  const [method, setMethod] = useState('JAZZCASH');
  const [amount, setAmount] = useState('3200');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tenantService.getMyBilling();
      if (res.data?.success) {
        setBillingData(res.data.billing);
        if (res.data.billing.businessType) {
          setActiveIndustryTab(res.data.billing.businessType);
        }
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
    const allPlans = Object.values(MODULE_PLANS_DATA).flatMap((m) => m.plans);
    const currentIndustryPlans = MODULE_PLANS_DATA[activeIndustryTab]?.plans || MODULE_PLANS_DATA.GENERAL_STORE.plans;
    const planObj = allPlans.find((p) => p.id === selectedPlanId) || currentIndustryPlans[1] || currentIndustryPlans[0];
    const price = billingCycle === 'yearly' ? planObj.yearlyPrice : planObj.monthlyPrice;
    setAmount(String(price));
  }, [selectedPlanId, billingCycle, activeIndustryTab]);

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

      {/* Industry Module Specific Plan Selector Tabs & Pricing Cards */}
      <div className="space-y-4">
        {/* Industry Module Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap gap-1.5">
          {Object.values(MODULE_PLANS_DATA).map((mod) => {
            const isTabActive = activeIndustryTab === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveIndustryTab(mod.id);
                  const firstProPlan = mod.plans[1] || mod.plans[0];
                  setSelectedPlanId(firstProPlan.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95 ${
                  isTabActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black shadow-sm ring-1 ring-emerald-500'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="text-sm">{mod.icon}</span>
                <span>{mod.title}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>{MODULE_PLANS_DATA[activeIndustryTab]?.title || 'Store Subscription Plans'}</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                Industry Specific
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-sans" dir="rtl">
              {MODULE_PLANS_DATA[activeIndustryTab]?.urdu}
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl flex-shrink-0">
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
          {(MODULE_PLANS_DATA[activeIndustryTab]?.plans || MODULE_PLANS_DATA.GENERAL_STORE.plans).map((p) => {
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {p.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                  {p.urdu && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 font-sans" dir="rtl">
                      {p.urdu}
                    </p>
                  )}

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
