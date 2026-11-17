const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String, // e.g., '7', '8', '9' or 'S', 'M', 'L' or '50ml', '100ml'
      default: '',
      trim: true,
    },
    color: {
      type: String, // e.g., 'Black', 'White', 'Brown'
      default: '',
      trim: true,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Variant stock cannot be negative'],
      alias: 'stockQuantity',
    },
    price: {
      type: Number,
      alias: 'salePrice',
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Variant cost price cannot be negative'],
    },
  },
  { _id: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Harmonize variant aliases in JSON/Object output
variantSchema.post('init', function () {
  if (this.stockQuantity === undefined && this.stock !== undefined) {
    this.stockQuantity = this.stock;
  }
  if (this.stock === undefined && this.stockQuantity !== undefined) {
    this.stock = this.stockQuantity;
  }
});

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
      alias: 'title',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode / SKU is required'],
      trim: true,
      uppercase: true,
      alias: 'sku',
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: [0, 'Sale price must be positive'],
      alias: 'price',
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
      alias: 'stockQuantity',
    },
    minStockAlert: {
      type: Number,
      default: 5,
      min: [0, 'Minimum stock threshold cannot be negative'],
      alias: 'lowStockAlert',
    },
    businessType: {
      type: String,
      enum: ['FOOTWEAR', 'GARMENTS', 'GENERAL_STORE', 'PERFUME'],
      default: 'GENERAL_STORE',
      index: true,
    },
    variants: [variantSchema],
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
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Guarantee dual-access for all clients and legacy controllers
        ret.title = ret.title || ret.name;
        ret.name = ret.name || ret.title;
        ret.sku = ret.sku || ret.barcode;
        ret.barcode = ret.barcode || ret.sku;
        ret.price = ret.price !== undefined ? ret.price : ret.salePrice;
        ret.salePrice = ret.salePrice !== undefined ? ret.salePrice : ret.price;
        ret.stockQuantity = ret.stockQuantity !== undefined ? ret.stockQuantity : ret.stock;
        ret.stock = ret.stock !== undefined ? ret.stock : ret.stockQuantity;
        ret.lowStockAlert = ret.lowStockAlert !== undefined ? ret.lowStockAlert : ret.minStockAlert;
        ret.minStockAlert = ret.minStockAlert !== undefined ? ret.minStockAlert : ret.lowStockAlert;
        if (Array.isArray(ret.variants)) {
          ret.variants = ret.variants.map((v) => ({
            ...v,
            stockQuantity: v.stockQuantity !== undefined ? v.stockQuantity : v.stock,
            stock: v.stock !== undefined ? v.stock : v.stockQuantity,
            price: v.price !== undefined ? v.price : ret.price,
          }));
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.title = ret.title || ret.name;
        ret.name = ret.name || ret.title;
        ret.sku = ret.sku || ret.barcode;
        ret.barcode = ret.barcode || ret.sku;
        ret.price = ret.price !== undefined ? ret.price : ret.salePrice;
        ret.salePrice = ret.salePrice !== undefined ? ret.salePrice : ret.price;
        ret.stockQuantity = ret.stockQuantity !== undefined ? ret.stockQuantity : ret.stock;
        ret.stock = ret.stock !== undefined ? ret.stock : ret.stockQuantity;
        ret.lowStockAlert = ret.lowStockAlert !== undefined ? ret.lowStockAlert : ret.minStockAlert;
        ret.minStockAlert = ret.minStockAlert !== undefined ? ret.minStockAlert : ret.lowStockAlert;
        return ret;
      },
    },
  }
);

// Virtual property to check if low stock
productSchema.virtual('isLowStock').get(function () {
  const currentStock = this.stock !== undefined ? this.stock : (this.stockQuantity || 0);
  const minAlert = this.minStockAlert !== undefined ? this.minStockAlert : (this.lowStockAlert || 5);
  return currentStock <= minAlert;
});

// Compound indexes: Barcode must be unique per tenant
productSchema.index({ tenantId: 1, barcode: 1 }, { unique: true });
productSchema.index({ tenantId: 1, businessType: 1 });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, status: 1 });
productSchema.index({ tenantId: 1, name: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);
