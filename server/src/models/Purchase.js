const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be positive'],
    },
    unitCost: {
      type: Number,
      required: true,
      min: [0, 'Unit cost must be non-negative'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice or Bilty number is required'],
      trim: true,
      uppercase: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: [purchaseItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount must be positive'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: [0, 'Balance due cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Credit (Payable)', 'JazzCash/Easypaisa'],
      default: 'Cash',
    },
    status: {
      type: String,
      enum: ['Received', 'Pending', 'Cancelled'],
      default: 'Received',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index({ tenantId: 1, invoiceNumber: 1 });
purchaseSchema.index({ tenantId: 1, invoiceDate: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
