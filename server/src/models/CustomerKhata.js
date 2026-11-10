const mongoose = require('mongoose');

const khataTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['UDHAR_GIVEN', 'PAYMENT_RECEIVED'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Transaction amount must be positive'],
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  orderNumber: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  recordedByName: {
    type: String,
    default: '',
  },
});

const customerKhataSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [80, 'Customer name cannot exceed 80 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Customer phone/mobile number is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    creditLimit: {
      type: Number,
      default: 0, // 0 = unlimited or max threshold
      min: [0, 'Credit limit cannot be negative'],
    },
    totalDebt: {
      type: Number,
      default: 0, // Running balance of money customer owes to the shop
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    transactions: [khataTransactionSchema],
  },
  {
    timestamps: true,
  }
);

// Compound unique index: A phone number must be unique within a tenant store
customerKhataSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
customerKhataSchema.index({ tenantId: 1, totalDebt: -1 });

module.exports = mongoose.model('CustomerKhata', customerKhataSchema);
