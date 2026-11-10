const CustomerKhata = require('../models/CustomerKhata');
const Tenant = require('../models/Tenant');
const memoryStore = require('../config/memoryStore');
const { getPlanLimits } = require('../config/plans');

// @desc    Get all khata customers for tenant
// @route   GET /api/khata/customers
// @access  Private (Store Admin, Cashier)
const getCustomers = async (req, res, next) => {
  try {
    const { search, onlyDebtors } = req.query;
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      let list = memoryStore.khatas.filter((k) => k.tenantId === tenantId);

      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (k) => k.name.toLowerCase().includes(q) || k.phone.includes(q)
        );
      }

      if (onlyDebtors === 'true') {
        list = list.filter((k) => k.totalDebt > 0);
      }

      list.sort((a, b) => b.totalDebt - a.totalDebt);

      return res.status(200).json({
        success: true,
        count: list.length,
        customers: list,
      });
    }

    const query = { tenantId };
    if (search && search.trim() !== '') {
      const q = search.trim();
      query.$or = [{ name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }];
    }
    if (onlyDebtors === 'true') {
      query.totalDebt = { $gt: 0 };
    }

    const customers = await CustomerKhata.find(query).sort({ totalDebt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single khata customer with full ledger/passbook
// @route   GET /api/khata/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const customer = memoryStore.khatas.find(
        (k) => k._id === req.params.id && k.tenantId === tenantId
      );
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Khata customer not found' });
      }
      return res.status(200).json({ success: true, customer });
    }

    const customer = await CustomerKhata.findOne({
      _id: req.params.id,
      tenantId,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Khata customer not found' });
    }

    res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new khata customer
// @route   POST /api/khata/customers
// @access  Private (Store Admin, Cashier)
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, creditLimit = 0, initialDebt = 0, notes } = req.body;
    const tenantId = req.user.tenantId;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required',
      });
    }

    // Check Plan Limits for Khata Customers
    let tenant;
    if (global.useMemoryStore) {
      tenant = (memoryStore.tenants || []).find((t) => t._id === tenantId);
    } else {
      tenant = await Tenant.findById(tenantId);
    }

    const limits = tenant?.planLimits || getPlanLimits(tenant?.plan);
    const currentKhataCount = global.useMemoryStore
      ? (memoryStore.khatas || []).filter((k) => k.tenantId === tenantId).length
      : await CustomerKhata.countDocuments({ tenantId });

    if (limits && currentKhataCount >= limits.maxKhataCustomers) {
      return res.status(403).json({
        success: false,
        code: 'PLAN_LIMIT_REACHED',
        message: `Khata customer ledger limit of ${limits.maxKhataCustomers} reached for your ${tenant?.plan?.toUpperCase() || 'CURRENT'} plan. Please upgrade to Standard or Premium for unlimited Khata accounts.`,
      });
    }

    if (global.useMemoryStore) {
      const existing = memoryStore.khatas.find(
        (k) => k.tenantId === tenantId && k.phone === phone.trim()
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A customer with mobile number "${phone}" already exists in this store.`,
        });
      }

      const initialAmount = Number(initialDebt) || 0;
      const transactions = [];

      if (initialAmount > 0) {
        transactions.push({
          _id: `tx_${Date.now()}`,
          type: 'UDHAR_GIVEN',
          amount: initialAmount,
          balanceAfter: initialAmount,
          notes: notes || 'Opening Balance (Purana Udhar)',
          date: new Date(),
          recordedBy: req.user._id,
          recordedByName: req.user.name,
        });
      }

      const newCustomer = {
        _id: `khata_${Date.now()}`,
        tenantId,
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || '',
        creditLimit: Number(creditLimit) || 0,
        totalDebt: initialAmount,
        status: 'active',
        transactions,
        createdAt: new Date(),
      };

      memoryStore.khatas.unshift(newCustomer);

      return res.status(201).json({
        success: true,
        message: 'Customer khata created successfully',
        customer: newCustomer,
      });
    }

    const existing = await CustomerKhata.findOne({ tenantId, phone: phone.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A customer with mobile number "${phone}" already exists in this store.`,
      });
    }

    const initialAmount = Number(initialDebt) || 0;
    const transactions = [];

    if (initialAmount > 0) {
      transactions.push({
        type: 'UDHAR_GIVEN',
        amount: initialAmount,
        balanceAfter: initialAmount,
        notes: notes || 'Opening Balance (Purana Udhar)',
        date: new Date(),
        recordedBy: req.user._id,
        recordedByName: req.user.name,
      });
    }

    const customer = await CustomerKhata.create({
      tenantId,
      name: name.trim(),
      phone: phone.trim(),
      address: address?.trim() || '',
      creditLimit: Number(creditLimit) || 0,
      totalDebt: initialAmount,
      transactions,
    });

    res.status(201).json({
      success: true,
      message: 'Customer khata created successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record customer payment / collection (Wasooli)
// @route   POST /api/khata/customers/:id/payment
// @access  Private (Store Admin, Cashier)
const recordKhataPayment = async (req, res, next) => {
  try {
    const { amount, notes, paymentMethod = 'CASH' } = req.body;
    const tenantId = req.user.tenantId;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive payment amount',
      });
    }

    if (global.useMemoryStore) {
      const customer = memoryStore.khatas.find(
        (k) => k._id === req.params.id && k.tenantId === tenantId
      );
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const newBalance = Number((customer.totalDebt - paymentAmount).toFixed(2));
      const tx = {
        _id: `tx_${Date.now()}`,
        type: 'PAYMENT_RECEIVED',
        amount: paymentAmount,
        balanceAfter: newBalance,
        notes: notes || `Payment Received via ${paymentMethod} (Wasooli)`,
        date: new Date(),
        recordedBy: req.user._id,
        recordedByName: req.user.name,
      };

      customer.totalDebt = newBalance;
      customer.transactions.unshift(tx);

      return res.status(200).json({
        success: true,
        message: `Wasooli of Rs. ${paymentAmount.toLocaleString()} recorded successfully`,
        transaction: tx,
        currentDebt: newBalance,
        customer,
      });
    }

    const customer = await CustomerKhata.findOne({ _id: req.params.id, tenantId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const newBalance = Number((customer.totalDebt - paymentAmount).toFixed(2));
    const tx = {
      type: 'PAYMENT_RECEIVED',
      amount: paymentAmount,
      balanceAfter: newBalance,
      notes: notes || `Payment Received via ${paymentMethod} (Wasooli)`,
      date: new Date(),
      recordedBy: req.user._id,
      recordedByName: req.user.name,
    };

    customer.totalDebt = newBalance;
    customer.transactions.unshift(tx);
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Wasooli of Rs. ${paymentAmount.toLocaleString()} recorded successfully`,
      transaction: tx,
      currentDebt: newBalance,
      customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Khata Dashboard Metrics (Total Market Debt, Debtors, Today's Wasooli)
// @route   GET /api/khata/metrics
// @access  Private (Store Admin, Cashier)
const getKhataMetrics = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (global.useMemoryStore) {
      const tenantCustomers = memoryStore.khatas.filter((k) => k.tenantId === tenantId);
      const totalMarketDebt = tenantCustomers.reduce((sum, c) => sum + (c.totalDebt > 0 ? c.totalDebt : 0), 0);
      const totalDebtorsCount = tenantCustomers.filter((c) => c.totalDebt > 0).length;

      let todayWasooli = 0;
      tenantCustomers.forEach((c) => {
        c.transactions.forEach((tx) => {
          if (tx.type === 'PAYMENT_RECEIVED' && new Date(tx.date) >= todayStart) {
            todayWasooli += tx.amount;
          }
        });
      });

      const topDebtors = [...tenantCustomers]
        .filter((c) => c.totalDebt > 0)
        .sort((a, b) => b.totalDebt - a.totalDebt)
        .slice(0, 5);

      return res.status(200).json({
        success: true,
        metrics: {
          totalMarketDebt: Math.round(totalMarketDebt * 100) / 100,
          totalDebtorsCount,
          todayWasooli: Math.round(todayWasooli * 100) / 100,
          totalCustomers: tenantCustomers.length,
        },
        topDebtors,
      });
    }

    const customers = await CustomerKhata.find({ tenantId });
    const totalMarketDebt = customers.reduce((sum, c) => sum + (c.totalDebt > 0 ? c.totalDebt : 0), 0);
    const totalDebtorsCount = customers.filter((c) => c.totalDebt > 0).length;

    let todayWasooli = 0;
    customers.forEach((c) => {
      c.transactions.forEach((tx) => {
        if (tx.type === 'PAYMENT_RECEIVED' && new Date(tx.date) >= todayStart) {
          todayWasooli += tx.amount;
        }
      });
    });

    const topDebtors = await CustomerKhata.find({ tenantId, totalDebt: { $gt: 0 } })
      .sort({ totalDebt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      metrics: {
        totalMarketDebt: Math.round(totalMarketDebt * 100) / 100,
        totalDebtorsCount,
        todayWasooli: Math.round(todayWasooli * 100) / 100,
        totalCustomers: customers.length,
      },
      topDebtors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  recordKhataPayment,
  getKhataMetrics,
};
