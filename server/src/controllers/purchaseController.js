const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const memoryStore = require('../config/memoryStore');

// @desc    Get all wholesale purchase invoices
// @route   GET /api/purchases
// @access  Private (Store Admin, Cashier)
const getPurchases = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { supplierId, page = 1, limit = 50 } = req.query;

    if (global.useMemoryStore) {
      let filtered = (memoryStore.purchases || []).filter(
        (p) => !tenantId || p.tenantId === tenantId
      );

      if (supplierId) {
        filtered = filtered.filter((p) => p.supplier === supplierId);
      }

      filtered.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));

      const totalPurchased = filtered.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
      const totalDue = filtered.reduce((sum, p) => sum + Number(p.balanceDue || 0), 0);

      return res.status(200).json({
        success: true,
        count: filtered.length,
        totalPurchased,
        totalDue,
        purchases: filtered,
      });
    }

    const query = { tenantId };
    if (supplierId) {
      query.supplier = supplierId;
    }

    const purchases = await Purchase.find(query).sort({ invoiceDate: -1 });
    const totalPurchased = purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const totalDue = purchases.reduce((sum, p) => sum + Number(p.balanceDue || 0), 0);

    res.status(200).json({
      success: true,
      count: purchases.length,
      totalPurchased,
      totalDue,
      purchases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new wholesale purchase & auto-increment product inventory
// @route   POST /api/purchases
// @access  Private (Store Admin)
const createPurchase = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      supplierId,
      invoiceNumber,
      invoiceDate,
      items,
      paidAmount = 0,
      paymentMethod = 'Cash',
      notes,
    } = req.body;

    if (!supplierId || !invoiceNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide supplier, invoice number, and at least one purchase item.',
      });
    }

    // Compute line items
    let computedTotal = 0;
    const validatedItems = [];

    for (const it of items) {
      const qty = Number(it.quantity);
      const cost = Number(it.unitCost);
      if (!qty || qty <= 0 || cost === undefined || cost < 0) {
        return res.status(400).json({
          success: false,
          message: 'Every item must have a valid positive quantity and unit cost.',
        });
      }
      const sub = Math.round(qty * cost * 100) / 100;
      computedTotal += sub;
      validatedItems.push({
        product: it.product,
        title: it.title || 'Product',
        sku: it.sku || 'SKU',
        quantity: qty,
        unitCost: cost,
        subtotal: sub,
      });
    }

    const totalAmount = Math.round(computedTotal * 100) / 100;
    const paid = Math.min(totalAmount, Math.max(0, Number(paidAmount) || 0));
    const balanceDue = Math.round((totalAmount - paid) * 100) / 100;
    const dateParsed = invoiceDate ? new Date(invoiceDate) : new Date();

    if (global.useMemoryStore) {
      const supplier = (memoryStore.suppliers || []).find((s) => s._id === supplierId);
      const supplierName = supplier ? supplier.companyName || supplier.name : 'Wholesale Supplier';

      const newPurchase = {
        _id: `pur_${Date.now()}`,
        tenantId,
        supplier: supplierId,
        supplierName,
        invoiceNumber: invoiceNumber.trim().toUpperCase(),
        invoiceDate: dateParsed,
        items: validatedItems,
        totalAmount,
        paidAmount: paid,
        balanceDue,
        paymentMethod,
        status: 'Received',
        notes: (notes || '').trim(),
        createdAt: new Date(),
      };

      if (!memoryStore.purchases) memoryStore.purchases = [];
      memoryStore.purchases.unshift(newPurchase);

      // Auto-increment inventory stock & update product costPrice
      for (const it of validatedItems) {
        const prod = (memoryStore.products || []).find(
          (p) => (p._id === it.product || p.sku === it.sku) && (!tenantId || p.tenantId === tenantId)
        );
        if (prod) {
          prod.stockQuantity = Number(prod.stockQuantity || 0) + it.quantity;
          prod.costPrice = it.unitCost;
        }
      }

      // Update supplier balance payable
      if (supplier) {
        supplier.totalPurchases = (supplier.totalPurchases || 0) + totalAmount;
        supplier.totalPaid = (supplier.totalPaid || 0) + paid;
        supplier.balancePayable = (supplier.balancePayable || 0) + balanceDue;
      }

      return res.status(201).json({
        success: true,
        message: `Purchase invoice ${newPurchase.invoiceNumber} recorded. Stock successfully inwarded!`,
        purchase: newPurchase,
      });
    }

    const supplier = await Supplier.findOne({ _id: supplierId, tenantId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const purchase = await Purchase.create({
      tenantId,
      supplier: supplierId,
      supplierName: supplier.companyName || supplier.name,
      invoiceNumber: invoiceNumber.trim().toUpperCase(),
      invoiceDate: dateParsed,
      items: validatedItems,
      totalAmount,
      paidAmount: paid,
      balanceDue,
      paymentMethod,
      status: 'Received',
      notes: (notes || '').trim(),
    });

    // Auto-increment product stock & update cost price
    for (const it of validatedItems) {
      await Product.findOneAndUpdate(
        { _id: it.product, tenantId },
        {
          $inc: { stockQuantity: it.quantity },
          $set: { costPrice: it.unitCost },
        }
      );
    }

    // Update supplier accounts payable
    supplier.totalPurchases += totalAmount;
    supplier.totalPaid += paid;
    supplier.balancePayable += balanceDue;
    await supplier.save();

    res.status(201).json({
      success: true,
      message: `Purchase invoice ${purchase.invoiceNumber} recorded. Stock successfully inwarded!`,
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  createPurchase,
};
