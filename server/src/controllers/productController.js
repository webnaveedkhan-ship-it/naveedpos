const Product = require('../models/Product');
const Category = require('../models/Category');
const Tenant = require('../models/Tenant');
const memoryStore = require('../config/memoryStore');
const { getPlanLimits } = require('../config/plans');
const { uploadToCloud } = require('../services/cloudStorageService');
const { getDummyProducts } = require('../config/dummyProducts');

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      businessType,
      lowStock,
      page = 1,
      limit = 20,
      all = 'false',
      sort = 'title',
    } = req.query;

    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const matchTenant = (p) => {
        if (!p) return false;
        if (!tenantId) return true;
        return (p.tenantId || '').toString() === tenantId.toString();
      };

      let filtered = memoryStore.products.filter(
        (p) => p && p.status === 'active' && matchTenant(p)
      );

      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            (p.name || p.title || '').toLowerCase().includes(q) ||
            (p.barcode || p.sku || '').toLowerCase().includes(q)
        );
      }

      if (category && category !== 'All') {
        filtered = filtered.filter((p) => p.category === category);
      }

      if (businessType && businessType !== 'All') {
        filtered = filtered.filter(
          (p) => (p.businessType || 'GENERAL_STORE').toUpperCase() === businessType.toUpperCase()
        );
      }

      if (lowStock === 'true') {
        filtered = filtered.filter(
          (p) =>
            Number(p.stock !== undefined ? p.stock : p.stockQuantity || 0) <=
            Number(p.minStockAlert !== undefined ? p.minStockAlert : (p.lowStockAlert || 5))
        );
      }

      if (all === 'true') {
        return res.status(200).json({
          success: true,
          count: filtered.length,
          products: filtered,
        });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(skip, skip + limitNum);

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum) || 1,
        currentPage: pageNum,
        products: paginated,
      });
    }

    const query = { status: 'active', tenantId };
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { barcode: searchRegex },
        { sku: searchRegex },
      ];
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (businessType && businessType !== 'All') {
      query.businessType = businessType.toUpperCase();
    }
    if (lowStock === 'true') {
      query.$expr = {
        $lte: [
          { $ifNull: ['$stock', '$stockQuantity'] },
          { $ifNull: ['$minStockAlert', '$lowStockAlert'] },
        ],
      };
    }

    if (all === 'true') {
      const products = await Product.find(query).sort({ name: 1, title: 1 });
      return res.status(200).json({
        success: true,
        count: (products || []).length,
        products: products || [],
      });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ name: 1, title: 1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: (products || []).length,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / limitNum) || 1,
      currentPage: pageNum,
      products: products || [],
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const product = memoryStore.products.find(
        (p) => p._id === req.params.id && (!tenantId || p.tenantId === tenantId)
      );
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(200).json({ success: true, product });
    }

    const product = await Product.findOne({ _id: req.params.id, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const getProductBySku = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const product = memoryStore.products.find(
        (p) => p.sku === req.params.sku.toUpperCase() && p.status === 'active' && (!tenantId || p.tenantId === tenantId)
      );
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with barcode/SKU '${req.params.sku}' not found`,
        });
      }
      return res.status(200).json({ success: true, product });
    }

    const product = await Product.findOne({
      sku: req.params.sku.toUpperCase(),
      status: 'active',
      tenantId,
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with barcode/SKU '${req.params.sku}' not found`,
      });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      title,
      barcode,
      sku,
      category,
      salePrice,
      price,
      costPrice,
      stock,
      stockQuantity,
      minStockAlert,
      lowStockAlert,
      businessType = 'GENERAL_STORE',
      description,
      unitType = 'piece',
      allowFractional = false,
      cartonSize = 1,
      cartonPrice = 0,
    } = req.body;

    const tenantId = req.user.tenantId;

    // Check Plan Limits & Entitlements
    let tenant;
    if (global.useMemoryStore) {
      tenant = (memoryStore.tenants || []).find((t) => t._id === tenantId);
    } else {
      tenant = await Tenant.findById(tenantId);
    }

    const limits = tenant?.planLimits || getPlanLimits(tenant?.plan);
    const isFractionalRequested =
      allowFractional === true ||
      allowFractional === 'true' ||
      ['kg', 'gram', 'liter', 'dozen'].includes(unitType);

    // 1. Fractional Unit Pricing Entitlement (Premium Plan / Trial only)
    if (isFractionalRequested && limits && limits.allowFractionalUnits === false) {
      return res.status(403).json({
        success: false,
        code: 'PLAN_LIMIT_REACHED',
        message:
          'Custom Fractional Unit Pricing (Kg, Grams, Dozens) is an exclusive feature of the Premium Supermart plan. Please upgrade your store plan.',
      });
    }

    // 2. Catalog Product Count Limit
    const currentProductsCount = global.useMemoryStore
      ? (memoryStore.products || []).filter((p) => p.tenantId === tenantId).length
      : await Product.countDocuments({ tenantId });

    if (limits && currentProductsCount >= limits.maxProducts) {
      return res.status(403).json({
        success: false,
        code: 'PLAN_LIMIT_REACHED',
        message: `Product catalog limit of ${limits.maxProducts} reached for your ${tenant?.plan?.toUpperCase() || 'CURRENT'} plan. Please upgrade to Standard or Premium to add more products.`,
      });
    }

    const finalName = (name || title || '').trim();
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    const finalBarcode = (barcode || sku || ('SKU-' + Date.now())).trim().toUpperCase();
    const effectivePrice = Number(
      salePrice !== undefined && salePrice !== ''
        ? salePrice
        : price !== undefined && price !== ''
        ? price
        : req.body.sellingPrice || 0
    );
    const effectiveCost = Number(costPrice) || 0;
    const effectiveStock = Number(
      stock !== undefined && stock !== ''
        ? stock
        : stockQuantity !== undefined && stockQuantity !== ''
        ? stockQuantity
        : 0
    );
    const effectiveMinAlert = Number(
      minStockAlert !== undefined && minStockAlert !== ''
        ? minStockAlert
        : lowStockAlert !== undefined && lowStockAlert !== ''
        ? lowStockAlert
        : 5
    );

    const allowedTypes = ['FOOTWEAR', 'GARMENTS', 'GENERAL_STORE', 'PERFUME'];
    const finalBusinessType = allowedTypes.includes((businessType || '').toUpperCase())
      ? businessType.toUpperCase()
      : 'GENERAL_STORE';

    let rawVariants = [];
    if (req.body.variants) {
      try {
        rawVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
        if (!Array.isArray(rawVariants)) rawVariants = [];
      } catch (e) {
        rawVariants = [];
      }
    }

    const normalizedVariants = rawVariants.map((v, idx) => ({
      size: (v.size || '').toString().trim(),
      color: (v.color || '').toString().trim(),
      sku: (v.sku || `${finalBarcode}-V${idx + 1}`).toString().trim().toUpperCase(),
      stock: Number(v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : 0)),
      stockQuantity: Number(v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : 0)),
      price: Number(v.price !== undefined ? v.price : (v.salePrice !== undefined ? v.salePrice : effectivePrice)),
      costPrice: Number(v.costPrice !== undefined ? v.costPrice : effectiveCost),
    }));

    // If variants have stock and total stock wasn't specified, calculate sum
    const totalVariantStock = normalizedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const finalStockCount = normalizedVariants.length > 0 && effectiveStock === 0 ? totalVariantStock : effectiveStock;

    const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop';

    if (global.useMemoryStore) {
      const exists = memoryStore.products.find(
        (p) =>
          p &&
          ((p.barcode || p.sku || '').toUpperCase() === finalBarcode) &&
          (p.tenantId || '').toString() === (tenantId || '').toString()
      );
      if (exists) {
        return res.status(400).json({
          success: false,
          message: `A product with SKU/Barcode "${finalBarcode}" already exists in your store.`,
        });
      }
      const isFractional = isFractionalRequested;
      let imagePath = req.body.image || '';
      if (req.file) {
        const uploaded = await uploadToCloud(req.file.buffer, req.file.originalname, req.file.mimetype, 'products');
        imagePath = uploaded.url;
      }
      const newProduct = {
        _id: `prod_${Date.now()}`,
        tenantId,
        name: finalName,
        title: finalName,
        barcode: finalBarcode,
        sku: finalBarcode,
        category: category || 'General Retail',
        costPrice: effectiveCost,
        salePrice: effectivePrice,
        price: effectivePrice,
        stock: finalStockCount,
        stockQuantity: finalStockCount,
        minStockAlert: effectiveMinAlert,
        lowStockAlert: effectiveMinAlert,
        businessType: finalBusinessType,
        unitType: unitType || 'piece',
        allowFractional: isFractional,
        cartonSize: Number(cartonSize) || 1,
        cartonPrice: Number(cartonPrice) || 0,
        image: imagePath || fallbackImg,
        description: description || '',
        variants: normalizedVariants,
        status: 'active',
        createdAt: new Date(),
      };
      memoryStore.products.unshift(newProduct);
      return res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
    }

    const existingProduct = await Product.findOne({
      $or: [{ barcode: finalBarcode }, { sku: finalBarcode }],
      tenantId,
    });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: `A product with SKU/Barcode "${finalBarcode}" already exists in your store.`,
      });
    }

    let imagePath = '';
    if (req.file) {
      const uploaded = await uploadToCloud(req.file.buffer, req.file.originalname, req.file.mimetype, 'products');
      imagePath = uploaded.url;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    const isFractional = allowFractional === true || allowFractional === 'true' || ['kg', 'gram', 'liter'].includes(unitType);
    const product = await Product.create({
      tenantId,
      name: finalName,
      title: finalName,
      barcode: finalBarcode,
      sku: finalBarcode,
      category: category || 'General Retail',
      costPrice: effectiveCost,
      salePrice: effectivePrice,
      price: effectivePrice,
      stock: finalStockCount,
      stockQuantity: finalStockCount,
      minStockAlert: effectiveMinAlert,
      lowStockAlert: effectiveMinAlert,
      businessType: finalBusinessType,
      unitType: unitType || 'piece',
      allowFractional: isFractional,
      cartonSize: Number(cartonSize) || 1,
      cartonPrice: Number(cartonPrice) || 0,
      image: imagePath || fallbackImg,
      description: description || '',
      variants: normalizedVariants,
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    let normalizedVariants = undefined;
    if (req.body.variants !== undefined) {
      try {
        const raw = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
        if (Array.isArray(raw)) {
          normalizedVariants = raw.map((v, idx) => ({
            size: (v.size || '').toString().trim(),
            color: (v.color || '').toString().trim(),
            sku: (v.sku || `V${idx + 1}`).toString().trim().toUpperCase(),
            stock: Number(v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : 0)),
            stockQuantity: Number(v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : 0)),
            price: Number(v.price !== undefined ? v.price : (v.salePrice !== undefined ? v.salePrice : 0)),
            costPrice: Number(v.costPrice !== undefined ? v.costPrice : 0),
          }));
        }
      } catch (e) {
        normalizedVariants = [];
      }
    }

    const nameVal = req.body.name || req.body.title;
    const barcodeVal = req.body.barcode || req.body.sku;
    const priceVal = req.body.salePrice !== undefined ? req.body.salePrice : req.body.price;
    const stockVal = req.body.stock !== undefined ? req.body.stock : req.body.stockQuantity;
    const alertVal = req.body.minStockAlert !== undefined ? req.body.minStockAlert : req.body.lowStockAlert;

    if (global.useMemoryStore) {
      const index = memoryStore.products.findIndex((p) => p._id === req.params.id && p.tenantId === tenantId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const existing = memoryStore.products[index];
      const updated = {
        ...existing,
        ...req.body,
        name: nameVal || existing.name || existing.title,
        title: nameVal || existing.title || existing.name,
        barcode: barcodeVal ? barcodeVal.toUpperCase() : existing.barcode || existing.sku,
        sku: barcodeVal ? barcodeVal.toUpperCase() : existing.sku || existing.barcode,
        salePrice: priceVal !== undefined ? Number(priceVal) : existing.salePrice || existing.price,
        price: priceVal !== undefined ? Number(priceVal) : existing.price || existing.salePrice,
        costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : existing.costPrice,
        stock: stockVal !== undefined ? Number(stockVal) : existing.stock !== undefined ? existing.stock : existing.stockQuantity,
        stockQuantity: stockVal !== undefined ? Number(stockVal) : existing.stockQuantity !== undefined ? existing.stockQuantity : existing.stock,
        minStockAlert: alertVal !== undefined ? Number(alertVal) : existing.minStockAlert || existing.lowStockAlert,
        lowStockAlert: alertVal !== undefined ? Number(alertVal) : existing.lowStockAlert || existing.minStockAlert,
        businessType: req.body.businessType ? req.body.businessType.toUpperCase() : existing.businessType || 'GENERAL_STORE',
        variants: normalizedVariants !== undefined ? normalizedVariants : existing.variants || [],
        image: existing.image,
      };
      if (req.file) {
        const uploaded = await uploadToCloud(req.file.buffer, req.file.originalname, req.file.mimetype, 'products');
        updated.image = uploaded.url;
      } else if (req.body.image !== undefined) {
        updated.image = req.body.image;
      }
      memoryStore.products[index] = updated;
      return res.status(200).json({ success: true, message: 'Product updated', product: updated });
    }

    let product = await Product.findOne({ _id: req.params.id, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updateData = { ...req.body };
    if (nameVal) {
      updateData.name = nameVal;
      updateData.title = nameVal;
    }
    if (barcodeVal) {
      updateData.barcode = barcodeVal.toUpperCase();
      updateData.sku = barcodeVal.toUpperCase();
    }
    if (priceVal !== undefined) {
      updateData.salePrice = Number(priceVal);
      updateData.price = Number(priceVal);
    }
    if (updateData.costPrice !== undefined) updateData.costPrice = Number(updateData.costPrice);
    if (stockVal !== undefined) {
      updateData.stock = Number(stockVal);
      updateData.stockQuantity = Number(stockVal);
    }
    if (alertVal !== undefined) {
      updateData.minStockAlert = Number(alertVal);
      updateData.lowStockAlert = Number(alertVal);
    }
    if (updateData.businessType) {
      updateData.businessType = updateData.businessType.toUpperCase();
    }
    if (normalizedVariants !== undefined) updateData.variants = normalizedVariants;

    if (req.file) {
      const uploaded = await uploadToCloud(req.file.buffer, req.file.originalname, req.file.mimetype, 'products');
      updateData.image = uploaded.url;
    }

    product = await Product.findOneAndUpdate({ _id: req.params.id, tenantId }, updateData, { new: true });
    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const index = memoryStore.products.findIndex((p) => p._id === req.params.id && p.tenantId === tenantId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      memoryStore.products.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Product removed from catalog' });
    }

    const product = await Product.findOne({ _id: req.params.id, tenantId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product removed from catalog' });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const distinct = Array.from(
        new Set(
          (memoryStore.products || [])
            .filter((p) => !tenantId || p.tenantId === tenantId)
            .map((p) => p.category)
            .filter(Boolean)
        )
      );
      return res.status(200).json({ success: true, categories: distinct.sort() });
    }

    const distinctCategories = await Product.distinct('category', { status: 'active', tenantId });
    res.status(200).json({
      success: true,
      categories: (distinctCategories || []).filter(Boolean).sort(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Products at or below Low Stock Threshold
// @route   GET /api/products/low-stock
// @access  Private (Store Admin, Cashier)
const getLowStockProducts = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const items = memoryStore.products
        .filter(
          (p) =>
            p &&
            p.status === 'active' &&
            (!tenantId || (p.tenantId || '').toString() === tenantId.toString()) &&
            Number(p.stockQuantity || 0) <= Number(p.lowStockAlert || p.lowStockThreshold || 5)
        )
        .sort((a, b) => Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0));

      return res.status(200).json({
        success: true,
        count: items.length,
        items,
        products: items,
      });
    }

    const items = await Product.find({
      tenantId,
      status: 'active',
      $expr: { $lte: ['$stockQuantity', '$lowStockAlert'] },
    })
      .sort({ stockQuantity: 1 })
      .select('title sku barcode category stockQuantity lowStockAlert lowStockThreshold costPrice price sellingPrice image imageUrl');

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick Restock Incoming Units & Update Wholesale Cost
// @route   PATCH /api/products/:id/restock
// @access  Private (Store Admin)
const quickRestock = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { quantityToAdd, newCostPrice } = req.body;

    const qty = Number(quantityToAdd);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid incoming restock quantity greater than 0.',
      });
    }

    if (global.useMemoryStore) {
      const product = memoryStore.products.find(
        (p) => p._id === req.params.id && (!tenantId || p.tenantId === tenantId)
      );

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found in this store catalog.' });
      }

      product.stockQuantity += qty;
      if (newCostPrice !== undefined && !isNaN(Number(newCostPrice)) && Number(newCostPrice) >= 0) {
        product.costPrice = Number(newCostPrice);
      }

      return res.status(200).json({
        success: true,
        message: `Successfully restocked +${qty} units of "${product.title}". New stock: ${product.stockQuantity}`,
        product,
      });
    }

    const updateOps = {
      $inc: { stockQuantity: qty },
    };

    if (newCostPrice !== undefined && !isNaN(Number(newCostPrice)) && Number(newCostPrice) >= 0) {
      updateOps.costPrice = Number(newCostPrice);
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      updateOps,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found in this store catalog.' });
    }

    res.status(200).json({
      success: true,
      message: `Successfully restocked +${qty} units of "${product.title}". New stock: ${product.stockQuantity}`,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed / Load authentic Pakistani demo retail products
// @route   POST /api/products/seed-dummy
// @access  Private (Store Owner / Admin)
const seedDummyProducts = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID required for seeding demo catalog' });
    }

    if (global.useMemoryStore) {
      const matchTenant = (p) => p && (p.tenantId || '').toString() === tenantId.toString();
      const existing = memoryStore.products.filter(
        (p) => p.status === 'active' && matchTenant(p)
      );
      if (existing.length === 0) {
        const dummy = getDummyProducts(tenantId);
        dummy.forEach((p) => memoryStore.products.push(p));
      }
      const updated = memoryStore.products.filter(
        (p) => p.status === 'active' && matchTenant(p)
      );
      return res.status(200).json({
        success: true,
        message: 'Dummy retail products seeded successfully',
        count: updated.length,
        products: updated,
      });
    }

    const existingCount = await Product.countDocuments({ tenantId, status: 'active' });
    if (existingCount === 0) {
      const dummy = getDummyProducts(tenantId).map((p) => {
        const { _id, ...rest } = p;
        return rest;
      });
      await Product.insertMany(dummy);
    }

    const currentProducts = await Product.find({ tenantId, status: 'active' });
    res.status(200).json({
      success: true,
      message: 'Dummy retail products seeded successfully',
      count: currentProducts.length,
      products: currentProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySku,
  getLowStockProducts,
  quickRestock,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  seedDummyProducts,
};
