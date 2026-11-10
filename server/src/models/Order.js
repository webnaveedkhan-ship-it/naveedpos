const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    alias: 'sellingPrice',
  },
  costPrice: {
    type: Number,
    default: 0,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cashierName: {
      type: String,
      required: true,
    },
    customer: {
      khataId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerKhata',
        default: null,
      },
      name: {
        type: String,
        default: 'Walk-in Customer',
      },
      phone: {
        type: String,
        default: '',
      },
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      alias: 'total',
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'KHATA', 'SPLIT', 'cash', 'card', 'khata', 'split'],
      required: true,
      uppercase: true,
    },
    paymentDetails: {
      cashTendered: {
        type: Number,
        default: 0,
      },
      changeGiven: {
        type: Number,
        default: 0,
      },
      cardAmount: {
        type: Number,
        default: 0,
      },
      cardLast4: {
        type: String,
        default: '',
      },
      cashAmount: {
        type: Number,
        default: 0,
      },
      khataAmount: {
        type: Number,
        default: 0,
      },
      previousDebt: {
        type: Number,
        default: 0,
      },
      balanceAfter: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['completed', 'refunded', 'cancelled'],
      default: 'completed',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ tenantId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, orderNumber: 1 });
orderSchema.index({ tenantId: 1, 'customer.khataId': 1 });

module.exports = mongoose.model('Order', orderSchema);
