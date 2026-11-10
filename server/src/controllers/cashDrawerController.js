const CashDrawerReconciliation = require('../models/CashDrawerReconciliation');
const Tenant = require('../models/Tenant');
const Order = require('../models/Order');
const CustomerKhata = require('../models/CustomerKhata');
const Expense = require('../models/Expense');
const memoryStore = require('../config/memoryStore');
const { getPlanLimits } = require('../config/plans');

// Helper to get start and end of today
const getTodayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get real-time cash drawer summary for today (sales, wasooli, expenses)
// @route   GET /api/cash-drawer/summary-today
// @access  Private (Store Admin, Cashier)
const getCashDrawerSummaryToday = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { start, end } = getTodayWindow();

    let cashSales = 0;
    let khataWasooliCash = 0;
    let cashExpenses = 0;

    if (global.useMemoryStore) {
      // 1. Cash Sales from Orders today
      const todayOrders = (memoryStore.orders || []).filter((o) => {
        if (tenantId && o.tenantId !== tenantId) return false;
        const d = new Date(o.createdAt || o.date);
        return d >= start && d <= end;
      });

      todayOrders.forEach((o) => {
        const method = (o.paymentMethod || 'CASH').toUpperCase();
        if (method === 'CASH') {
          cashSales += Number(o.grandTotal || o.total || 0);
        } else if (method === 'SPLIT') {
          cashSales += Number(o.paymentDetails?.cashAmount || 0);
        }
      });

      // 2. Khata Wasooli Cash received today
      const khatas = (memoryStore.khatas || []).filter(
        (k) => !tenantId || k.tenantId === tenantId
      );
      khatas.forEach((k) => {
        (k.transactions || []).forEach((tx) => {
          const d = new Date(tx.date);
          if (
            tx.type === 'PAYMENT_RECEIVED' &&
            d >= start &&
            d <= end &&
            (tx.paymentMethod || 'CASH').toUpperCase() === 'CASH'
          ) {
            khataWasooliCash += Number(tx.amount || 0);
          }
        });
      });

      // 3. Store Cash Expenses paid out today
      const todayExpenses = (memoryStore.expenses || []).filter((e) => {
        if (tenantId && e.tenantId !== tenantId) return false;
        const d = new Date(e.date);
        return d >= start && d <= end && (e.paymentMethod || 'Cash').toLowerCase() === 'cash';
      });

      cashExpenses = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    } else {
      // MongoDB aggregation
      const orders = await Order.find({
        tenantId,
        createdAt: { $gte: start, $lte: end },
      });

      orders.forEach((o) => {
        const method = (o.paymentMethod || 'CASH').toUpperCase();
        if (method === 'CASH') {
          cashSales += Number(o.grandTotal || o.total || 0);
        } else if (method === 'SPLIT') {
          cashSales += Number(o.paymentDetails?.cashAmount || 0);
        }
      });

      const khatas = await CustomerKhata.find({ tenantId });
      khatas.forEach((k) => {
        (k.transactions || []).forEach((tx) => {
          const d = new Date(tx.date);
          if (
            tx.type === 'PAYMENT_RECEIVED' &&
            d >= start &&
            d <= end &&
            (tx.paymentMethod || 'CASH').toUpperCase() === 'CASH'
          ) {
            khataWasooliCash += Number(tx.amount || 0);
          }
        });
      });

      const expenses = await Expense.find({
        tenantId,
        date: { $gte: start, $lte: end },
        paymentMethod: { $regex: /^cash$/i },
      });

      cashExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }

    cashSales = Math.round(cashSales * 100) / 100;
    khataWasooliCash = Math.round(khataWasooliCash * 100) / 100;
    cashExpenses = Math.round(cashExpenses * 100) / 100;
    const netCashChange = Math.round((cashSales + khataWasooliCash - cashExpenses) * 100) / 100;

    res.status(200).json({
      success: true,
      summary: {
        openingCash: 0,
        cashSales,
        khataWasooliCash,
        cashExpenses,
        netCashChange,
        expectedCash: netCashChange,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform Day-End Cash Drawer Reconciliation (Sham ka Hisaab)
// @route   POST /api/cash-drawer/reconcile
// @access  Private (Store Admin, Cashier)
const reconcileCashDrawer = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      openingCash = 0,
      countedCash,
      shift = 'Day-End Closing (Sham ka Hisaab)',
      denominations = {},
      notes = '',
    } = req.body;

    if (countedCash === undefined || isNaN(Number(countedCash))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the physical cash counted in the drawer.',
      });
    }

    // Verify Plan Limits
    let tenant;
    if (global.useMemoryStore) {
      tenant = (memoryStore.tenants || []).find((t) => t._id === tenantId);
    } else {
      tenant = await Tenant.findById(tenantId);
    }

    const limits = tenant?.planLimits || getPlanLimits(tenant?.plan);
    if (limits && limits.allowDrawerReconciliation === false) {
      return res.status(403).json({
        success: false,
        code: 'PLAN_LIMIT_REACHED',
        message:
          'Day-End Cash Drawer Reconciliation (Sham ka Hisaab) is available on Standard & Premium plans. Please upgrade your store plan.',
      });
    }

    // Calculate expected cash
    const { start, end } = getTodayWindow();
    let cashSales = 0;
    let khataWasooliCash = 0;
    let cashExpenses = 0;

    if (global.useMemoryStore) {
      const todayOrders = (memoryStore.orders || []).filter((o) => {
        if (tenantId && o.tenantId !== tenantId) return false;
        const d = new Date(o.createdAt || o.date);
        return d >= start && d <= end;
      });

      todayOrders.forEach((o) => {
        const method = (o.paymentMethod || 'CASH').toUpperCase();
        if (method === 'CASH') {
          cashSales += Number(o.grandTotal || o.total || 0);
        } else if (method === 'SPLIT') {
          cashSales += Number(o.paymentDetails?.cashAmount || 0);
        }
      });

      const khatas = (memoryStore.khatas || []).filter(
        (k) => !tenantId || k.tenantId === tenantId
      );
      khatas.forEach((k) => {
        (k.transactions || []).forEach((tx) => {
          const d = new Date(tx.date);
          if (
            tx.type === 'PAYMENT_RECEIVED' &&
            d >= start &&
            d <= end &&
            (tx.paymentMethod || 'CASH').toUpperCase() === 'CASH'
          ) {
            khataWasooliCash += Number(tx.amount || 0);
          }
        });
      });

      const todayExpenses = (memoryStore.expenses || []).filter((e) => {
        if (tenantId && e.tenantId !== tenantId) return false;
        const d = new Date(e.date);
        return d >= start && d <= end && (e.paymentMethod || 'Cash').toLowerCase() === 'cash';
      });

      cashExpenses = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    } else {
      const orders = await Order.find({
        tenantId,
        createdAt: { $gte: start, $lte: end },
      });

      orders.forEach((o) => {
        const method = (o.paymentMethod || 'CASH').toUpperCase();
        if (method === 'CASH') {
          cashSales += Number(o.grandTotal || o.total || 0);
        } else if (method === 'SPLIT') {
          cashSales += Number(o.paymentDetails?.cashAmount || 0);
        }
      });

      const khatas = await CustomerKhata.find({ tenantId });
      khatas.forEach((k) => {
        (k.transactions || []).forEach((tx) => {
          const d = new Date(tx.date);
          if (
            tx.type === 'PAYMENT_RECEIVED' &&
            d >= start &&
            d <= end &&
            (tx.paymentMethod || 'CASH').toUpperCase() === 'CASH'
          ) {
            khataWasooliCash += Number(tx.amount || 0);
          }
        });
      });

      const expenses = await Expense.find({
        tenantId,
        date: { $gte: start, $lte: end },
        paymentMethod: { $regex: /^cash$/i },
      });

      cashExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }

    const opening = Number(openingCash || 0);
    const expectedCash = Math.round((opening + cashSales + khataWasooliCash - cashExpenses) * 100) / 100;
    const counted = Number(countedCash);
    const diff = Math.round((counted - expectedCash) * 100) / 100;

    let status = 'MATCHED';
    if (diff > 0) status = 'SURPLUS';
    if (diff < 0) status = 'SHORTAGE';

    if (global.useMemoryStore) {
      const newRec = {
        _id: `rec_${Date.now()}`,
        tenantId,
        date: new Date(),
        shift,
        openingCash: opening,
        cashSales,
        khataWasooliCash,
        cashExpenses,
        expectedCash,
        countedCash: counted,
        difference: diff,
        status,
        denominations,
        notes: (notes || '').trim(),
        reconciledBy: req.user.name || 'Store Cashier',
        reconciledById: req.user._id,
        createdAt: new Date(),
      };

      if (!memoryStore.cashReconciliations) {
        memoryStore.cashReconciliations = [];
      }
      memoryStore.cashReconciliations.unshift(newRec);

      return res.status(201).json({
        success: true,
        message: `Cash Drawer Reconciliation recorded: ${status} (${diff >= 0 ? '+' : ''}Rs. ${diff})`,
        reconciliation: newRec,
      });
    }

    const rec = await CashDrawerReconciliation.create({
      tenantId,
      date: new Date(),
      shift,
      openingCash: opening,
      cashSales,
      khataWasooliCash,
      cashExpenses,
      expectedCash,
      countedCash: counted,
      difference: diff,
      status,
      denominations,
      notes: (notes || '').trim(),
      reconciledBy: req.user.name || 'Store Cashier',
      reconciledById: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Cash Drawer Reconciliation recorded: ${status} (${diff >= 0 ? '+' : ''}Rs. ${diff})`,
      reconciliation: rec,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get historical cash drawer reconciliation logs
// @route   GET /api/cash-drawer/history
// @access  Private (Store Admin, Cashier)
const getCashDrawerHistory = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const list = (memoryStore.cashReconciliations || [])
        .filter((r) => !tenantId || r.tenantId === tenantId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.status(200).json({
        success: true,
        count: list.length,
        history: list,
        reconciliations: list,
      });
    }

    const list = await CashDrawerReconciliation.find({ tenantId }).sort({ date: -1 }).limit(50);

    res.status(200).json({
      success: true,
      count: list.length,
      history: list,
      reconciliations: list,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCashDrawerSummaryToday,
  reconcileCashDrawer,
  getCashDrawerHistory,
};
