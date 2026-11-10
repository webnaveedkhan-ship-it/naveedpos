const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerEmail: {
      type: String,
      required: [true, 'Owner email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: 'Islamabad',
      trim: true,
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'suspended', 'expired'],
      default: 'trial',
      index: true,
    },
    plan: {
      type: String,
      enum: ['trial', 'basic', 'standard', 'premium', 'monthly', 'yearly'],
      default: 'trial',
    },
    planLimits: {
      maxProducts: { type: Number, default: 1500 },
      maxKhataCustomers: { type: Number, default: 5000 },
      allowWhatsApp: { type: Boolean, default: true },
      allowBarcodeGen: { type: Boolean, default: true },
      allowFractionalUnits: { type: Boolean, default: true },
      allowDrawerReconciliation: { type: Boolean, default: true },
      allowBackupExport: { type: Boolean, default: true },
    },
    subscriptionExpiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14-day trial
    },
    maxUsers: {
      type: Number,
      default: 5,
    },
    maxProducts: {
      type: Number,
      default: 1000,
    },
    settings: {
      currency: {
        type: String,
        default: 'PKR',
      },
      currencySymbol: {
        type: String,
        default: 'Rs.',
      },
      taxRate: {
        type: Number,
        default: 0, // Zero Sales Tax / GST
      },
      receiptHeader: {
        type: String,
        default: 'NORMEGA MART',
      },
      receiptFooter: {
        type: String,
        default: 'Software Powered by NaveedPOS',
      },
      address: {
        type: String,
        default: 'Commercial Market, Pakistan',
      },
      phone: {
        type: String,
        default: '+92 300 1234567',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to check if subscription is valid
tenantSchema.virtual('isSubscriptionActive').get(function () {
  return (
    (this.status === 'active' || this.status === 'trial') &&
    new Date(this.subscriptionExpiresAt) > new Date()
  );
});

module.exports = mongoose.model('Tenant', tenantSchema);