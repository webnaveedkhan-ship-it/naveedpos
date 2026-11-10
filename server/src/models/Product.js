const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU / Barcode is required'],
      trim: true,
      uppercase: true,
      alias: 'barcode',
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price must be positive'],
      alias: 'sellingPrice',
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    lowStockAlert: {
      type: Number,
      default: 5,
      min: [0, 'Low stock threshold cannot be negative'],
      alias: 'lowStockThreshold',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop',
      alias: 'imageUrl',
    },
    unitType: {
      type: String,
      enum: ['piece', 'kg', 'gram', 'liter', 'pack', 'carton', 'dozen'],
      default: 'piece',
    },
    allowFractional: {
      type: Boolean,
      default: false,
    },
    cartonSize: {
      type: Number,
      default: 1,
      min: [1, 'Carton size must be at least 1'],
    },
    cartonPrice: {
      type: Number,
      default: 0,
      min: [0, 'Carton price cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to check if low stock
productSchema.virtual('isLowStock').get(function () {
  return this.stockQuantity <= this.lowStockAlert;
});

// Compound index: SKU must be unique per tenant
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, title: 'text', sku: 'text' });

module.exports = mongoose.model('Product', productSchema);
