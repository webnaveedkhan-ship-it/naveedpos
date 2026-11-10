const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const memoryStore = require('../config/memoryStore');

// @desc    Get all suppliers with balances and totals
// @route   GET /api/suppliers
// @access  Private (Store Admin, Cashier)
const getSuppliers = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { search } = req.query;

    if (global.useMemoryStore) {
      let filtered = (memoryStore.suppliers || []).filter(
        (s) => !tenantId || s.tenantId === tenantId
      );

      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.companyName && s.companyName.toLowerCase().includes(q)) ||
            (s.phone && s.phone.includes(q))
        );
      }

      const totalPayable = filtered.reduce((sum, s) => sum + Number(s.balancePayable || 0), 0);

      return res.status(200).json({
        success: true,
        count: filtered.length,
        totalPayable,
        suppliers: filtered,
      });
    }

    const query = { tenantId, status: 'active' };
    if (search && search.trim() !== '') {
      const q = new RegExp(search.trim(), 'i');
      query.$or = [{ name: q }, { companyName: q }, { phone: q }];
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    const totalPayable = suppliers.reduce((sum, s) => sum + Number(s.balancePayable || 0), 0);

    res.status(200).json({
      success: true,
      count: suppliers.length,
      totalPayable,
      suppliers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new wholesale supplier
// @route   POST /api/suppliers
// @access  Private (Store Admin)
const createSupplier = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, companyName, phone, email, address, notes, initialBalance, balancePayable } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name and phone number are required.',
      });
    }

    const cleanPhone = phone.trim();
    const startingBalance = Number(balancePayable !== undefined ? balancePayable : initialBalance) || 0;

    if (global.useMemoryStore) {
      const exists = (memoryStore.suppliers || []).find(
        (s) => s.phone === cleanPhone && s.tenantId === tenantId
      );
      if (exists) {
        return res.status(400).json({
          success: false,
          message: `A supplier with phone number "${phone}" is already registered.`,
        });
      }

      const newSupplier = {
        _id: `sup_${Date.now()}`,
        tenantId,
        name: name.trim(),
        companyName: (companyName || '').trim(),
        phone: cleanPhone,
        email: (email || '').trim().toLowerCase(),
        address: (address || '').trim(),
        balancePayable: startingBalance,
        totalPurchases: startingBalance,
        totalPaid: 0,
        status: 'active',
        notes: (notes || '').trim(),
        createdAt: new Date(),
      };

      if (!memoryStore.suppliers) {
        memoryStore.suppliers = [];
      }
      memoryStore.suppliers.push(newSupplier);

      return res.status(201).json({
        success: true,
        message: 'Supplier registered successfully',
        supplier: newSupplier,
      });
    }

    const existing = await Supplier.findOne({ phone: cleanPhone, tenantId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A supplier with phone number "${phone}" is already registered.`,
      });
    }

    const supplier = await Supplier.create({
      tenantId,
      name: name.trim(),
      companyName: (companyName || '').trim(),
      phone: cleanPhone,
      email: (email || '').trim().toLowerCase(),
      address: (address || '').trim(),
      balancePayable: startingBalance,
      totalPurchases: startingBalance,
      notes: (notes || '').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Supplier registered successfully',
      supplier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record wholesale payment to supplier
// @route   POST /api/suppliers/:id/pay
// @access  Private (Store Admin)
const recordSupplierPayment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { amount, paymentMethod = 'Cash', notes } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid payment amount greater than zero.',
      });
    }

    if (global.useMemoryStore) {
      const supplier = (memoryStore.suppliers || []).find(
        (s) => s._id === id && (!tenantId || s.tenantId === tenantId)
      );
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      supplier.totalPaid = (supplier.totalPaid || 0) + payAmount;
      supplier.balancePayable = Math.max(0, (supplier.balancePayable || 0) - payAmount);

      return res.status(200).json({
        success: true,
        message: `Payment of Rs. ${payAmount} recorded for ${supplier.name}. Remaining payable: Rs. ${supplier.balancePayable}`,
        supplier,
      });
    }

    const supplier = await Supplier.findOne({ _id: id, tenantId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    supplier.totalPaid = (supplier.totalPaid || 0) + payAmount;
    supplier.balancePayable = Math.max(0, (supplier.balancePayable || 0) - payAmount);
    await supplier.save();

    res.status(200).json({
      success: true,
      message: `Payment of Rs. ${payAmount} recorded for ${supplier.name}. Remaining payable: Rs. ${supplier.balancePayable}`,
      supplier,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  recordSupplierPayment,
};
