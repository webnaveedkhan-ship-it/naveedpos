const mongoose = require('mongoose');

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      default: '',
      trim: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'trial'],
      default: 'standard',
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    paymentMethod: {
      type: String,
      enum: ['JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER', 'NAYAPAY', 'SADAPAY', 'CARD'],
      default: 'BANK_TRANSFER',
      required: true,
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction reference/ID is required'],
      trim: true,
    },
    receiptImageUrl: {
      type: String,
      default: '',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedByName: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedByName: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionPaymentSchema.index({ tenantId: 1, createdAt: -1 });
subscriptionPaymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);
