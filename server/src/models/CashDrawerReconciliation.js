const mongoose = require('mongoose');

const cashDrawerReconciliationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    shift: {
      type: String,
      default: 'Day-End Closing (Sham ka Hisaab)',
    },
    openingCash: {
      type: Number,
      default: 0,
    },
    cashSales: {
      type: Number,
      default: 0,
    },
    khataWasooliCash: {
      type: Number,
      default: 0,
    },
    cashExpenses: {
      type: Number,
      default: 0,
    },
    expectedCash: {
      type: Number,
      required: true,
    },
    countedCash: {
      type: Number,
      required: true,
    },
    difference: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['MATCHED', 'SURPLUS', 'SHORTAGE'],
      default: 'MATCHED',
    },
    denominations: {
      type: Map,
      of: Number,
      default: {},
    },
    notes: {
      type: String,
      default: '',
    },
    reconciledBy: {
      type: String,
      default: 'Store Cashier',
    },
    reconciledById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CashDrawerReconciliation', cashDrawerReconciliationSchema);
