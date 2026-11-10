const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: [
        'Rent',
        'Electricity',
        'Tea & Refreshments',
        'Salaries',
        'Transport & Delivery',
        'Maintenance',
        'Packaging',
        'Miscellaneous',
      ],
      default: 'Miscellaneous',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense description / title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [1, 'Amount must be greater than zero'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'JazzCash', 'Easypaisa'],
      default: 'Cash',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: String,
      default: 'Store Admin',
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ tenantId: 1, date: -1 });
expenseSchema.index({ tenantId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
