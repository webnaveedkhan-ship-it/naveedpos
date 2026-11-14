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

      // Auto-populate dummy products if store has no inventory yet
      if (filtered.length === 0 && !search && (!category || category === 'All') && lowStock !== 'true' && tenantId) {
        const dummy = getDummyProducts(tenantId);
        dummy.forEach((p) => memoryStore.products.push(p));
        filtered = memoryStore.products.filter(
          (p) => p && p.status === 'active' && matchTenant(p)
        );
      }

      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (p) => (p.title || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
        );
      }

      if (category && category !== 'All') {
        filtered = filtered.filter((p) => p.category === category);
      }

      if (lowStock === 'true') {
        filtered = filtered.filter(
          (p) => Number(p.stockQuantity || 0) <= Number(p.lowStockAlert || p.lowStockThreshold || 5)
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
      query.$or = [{ title: searchRegex }, { sku: searchRegex }];
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stockQuantity', '$lowStockAlert'] };
    }

    if (all === 'true') {
      const products = await Product.find(query).sort({ title: 1 });
      return res.status(200).json({
        success: true,
        count: (products || []).length,
        products: products || [],
      });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    let total = await Product.countDocuments(query);

    // Auto-populate dummy products for newly created store if no inventory exists yet
    if (total === 0 && !search && (!category || category === 'All') && lowStock !== 'true' && tenantId) {
      try {
        const dummy = getDummyProducts(tenantId).map((p) => {
          const { _id, ...rest } = p;
          return rest;
        });
        await Product.insertMany(dummy);
        total = await Product.countDocuments(query);
      } catch (e) {
        console.warn('Auto-seed dummy products info:', e.message);
      }
    }

    const products = await Product.find(query)
      .sort({ title: 1 })
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
      title,
      sku,
      category,
      price,
      costPrice,
      stockQuantity,
      lowStockAlert,
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

    let variants = [];
    if (req.body.variants) {
      try {
        variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
        if (!Array.isArray(variants)) variants = [];
      } catch (e) {
        variants = [];
      }
    }

    if (global.useMemoryStore) {
      const exists = memoryStore.products.find(
        (p) => p && p.sku === (sku || '').toUpperCase() && (p.tenantId || '').toString() === (tenantId || '').toString()
      );
      if (exists) {
        return res.status(400).json({
          success: false,
          message: `A product with SKU/Barcode "${sku}" already exists in your store.`,
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
        title,
        sku: sku.toUpperCase(),
        category,
        price: Number(price),
        costPrice: Number(costPrice) || 0,
        stockQuantity: Number(stockQuantity) || 0,
        lowStockAlert: Number(lowStockAlert) || 5,
        unitType: unitType || 'piece',
        allowFractional: isFractional,
        cartonSize: Number(cartonSize) || 1,
        cartonPrice: Number(cartonPrice) || 0,
        image: imagePath,
        description: description || '',
        variants: variants || [],
        status: 'active',
        createdAt: new Date(),
      };
      memoryStore.products.push(newProduct);
      return res.status(201).json({ success: true, message: 'Product created', product: newProduct });
    }

    const existingProduct = await Product.findOne({ sku: sku.toUpperCase(), tenantId });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: `A product with SKU/Barcode "${sku}" already exists in your store.`,
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
      title,
      sku: sku.toUpperCase(),
      category,
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      lowStockAlert: Number(lowStockAlert) || 5,
      unitType: unitType || 'piece',
      allowFractional: isFractional,
      cartonSize: Number(cartonSize) || 1,
      cartonPrice: Number(cartonPrice) || 0,
      image: imagePath,
      description: description || '',
      variants: variants || [],
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    let variants = undefined;
    if (req.body.variants !== undefined) {
      try {
        variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
        if (!Array.isArray(variants)) variants = [];
      } catch (e) {
        variants = [];
      }
    }

    if (global.useMemoryStore) {
      const index = memoryStore.products.findIndex((p) => p._id === req.params.id && p.tenantId === tenantId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const existing = memoryStore.products[index];
      const updated = {
        ...existing,
        ...req.body,
        price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
        costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : existing.costPrice,
        stockQuantity:
          req.body.stockQuantity !== undefined ? Number(req.body.stockQuantity) : existing.stockQuantity,
        lowStockAlert:
          req.body.lowStockAlert !== undefined ? Number(req.body.lowStockAlert) : existing.lowStockAlert,
        variants: variants !== undefined ? variants : existing.variants || [],
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
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.costPrice !== undefined) updateData.costPrice = Number(updateData.costPrice);
    if (updateData.stockQuantity !== undefined) updateData.stockQuantity = Number(updateData.stockQuantity);
    if (updateData.lowStockAlert !== undefined) updateData.lowStockAlert = Number(updateData.lowStockAlert);
    if (variants !== undefined) updateData.variants = variants;

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
