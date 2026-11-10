// Subscription Plans Configuration & Limits for NaveedPOS SaaS
const SUBSCRIPTION_PLANS = {
  trial: {
    id: 'trial',
    name: '14-Day Free Trial',
    price: 0,
    interval: '14 days',
    limits: {
      maxProducts: 1500,
      maxKhataCustomers: 10000,
      allowWhatsApp: true,
      allowBarcodeGen: true,
      allowFractionalUnits: true,
      allowDrawerReconciliation: true,
      allowBackupExport: true,
      allowCsvExport: true,
    },
    features: [
      'Full 14-Day Unmetered Access',
      'Up to 1,500 Products',
      'Unlimited Khata Accounts',
      '1-Click WhatsApp Receipts & Reminders',
      'Printable Barcode Sticker Generator',
      'Day-End Cash Drawer (Sham ka Hisaab)',
      'Fractional Loose Weight Support',
      'Full Shop Data Backup',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic Starter',
    tagline: 'Ideal for small neighborhood corner shops and kiosks',
    price: 1500,
    interval: 'month',
    limits: {
      maxProducts: 300,
      maxKhataCustomers: 50,
      allowWhatsApp: false,
      allowBarcodeGen: false,
      allowFractionalUnits: false,
      allowDrawerReconciliation: false,
      allowBackupExport: false,
      allowCsvExport: false,
    },
    features: [
      'Max 300 Products',
      'Max 50 Customer Khata accounts',
      'Core POS Billing Terminal',
      '80mm Clean Thermal Receipts (Zero Tax)',
      'Daily & Weekly Sales Reports',
      'Manual Khata Ledger Entry',
    ],
  },
  standard: {
    id: 'standard',
    name: 'Standard Retail',
    tagline: 'Most popular for busy grocery marts, pharmacies & general stores',
    price: 3000,
    interval: 'month',
    popular: true,
    limits: {
      maxProducts: 1500,
      maxKhataCustomers: 10000,
      allowWhatsApp: true,
      allowBarcodeGen: true,
      allowFractionalUnits: false,
      allowDrawerReconciliation: true,
      allowBackupExport: false,
      allowCsvExport: true,
    },
    features: [
      'Max 1,500 Products',
      'Unlimited Customer Khata accounts',
      '1-Click WhatsApp Receipts & Reminders',
      'Printable Barcode Sticker Generator',
      'Day-End Cash Drawer (Sham ka Hisaab)',
      'Daily, Weekly & Monthly Reports + CSV Export',
      'Daily Store Expense Manager',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Supermart',
    tagline: 'Comprehensive enterprise solution for wholesale & large supermarts',
    price: 5500,
    interval: 'month',
    limits: {
      maxProducts: 999999,
      maxKhataCustomers: 999999,
      allowWhatsApp: true,
      allowBarcodeGen: true,
      allowFractionalUnits: true,
      allowDrawerReconciliation: true,
      allowBackupExport: true,
      allowCsvExport: true,
    },
    features: [
      'Unlimited Products & Catalog',
      'Unlimited Customer Khata accounts',
      'All Standard Plan Features Included',
      'Custom Fractional Unit Pricing (Kg, Grams, Dozen)',
      'One-Click Full Shop JSON/CSV Backup & Download',
      'Wholesale Purchases & Supplier Accounts Payable',
      'Priority Super Admin Support Status',
    ],
  },
};

const getPlanLimits = (planId) => {
  const normalized = (planId || 'trial').toLowerCase();
  if (normalized === 'monthly') return SUBSCRIPTION_PLANS.standard.limits;
  if (normalized === 'yearly') return SUBSCRIPTION_PLANS.premium.limits;
  return SUBSCRIPTION_PLANS[normalized]?.limits || SUBSCRIPTION_PLANS.trial.limits;
};

module.exports = {
  SUBSCRIPTION_PLANS,
  getPlanLimits,
};
