const Expense = require('../models/Expense');
const memoryStore = require('../config/memoryStore');

// @desc    Get all store expenses with period & category filtering
// @route   GET /api/expenses
// @access  Private (Store Admin, Cashier)
const getExpenses = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { category, period = 'this_month', startDate, endDate, page = 1, limit = 50 } = req.query;

    let start = new Date();
    let end = new Date();
    const now = new Date();

    const normalizedPeriod = (period || 'this_month').toLowerCase();
    if (normalizedPeriod === 'today' || normalizedPeriod === 'daily') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (normalizedPeriod === 'this_week' || normalizedPeriod === 'weekly') {
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (normalizedPeriod === 'this_month' || normalizedPeriod === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (normalizedPeriod === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to this month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    if (global.useMemoryStore) {
      let filtered = (memoryStore.expenses || []).filter(
        (e) => !tenantId || e.tenantId === tenantId
      );

      if (period !== 'all') {
        filtered = filtered.filter((e) => {
          const d = new Date(e.date);
          return d >= start && d <= end;
        });
      }

      if (category && category !== 'All') {
        filtered = filtered.filter((e) => e.category === category);
      }

      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Category breakdown
      const categoryTotals = {};
      filtered.forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount || 0);
      });

      const cashAmount = filtered
        .filter((e) => e.paymentMethod === 'Cash')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const bankAmount = filtered
        .filter((e) => e.paymentMethod !== 'Cash')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const summary = {
        totalAmount,
        count: filtered.length,
        cashAmount,
        bankAmount,
        categoryBreakdown: categoryTotals,
      };

      return res.status(200).json({
        success: true,
        count: filtered.length,
        totalAmount,
        categoryTotals,
        summary,
        expenses: filtered,
      });
    }

    const query = { tenantId };
    if (period !== 'all') {
      query.date = { $gte: start, $lte: end };
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const categoryTotals = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount || 0);
    });

    const cashAmount = expenses
      .filter((e) => e.paymentMethod === 'Cash')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const bankAmount = expenses
      .filter((e) => e.paymentMethod !== 'Cash')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const summary = {
      totalAmount,
      count: expenses.length,
      cashAmount,
      bankAmount,
      categoryBreakdown: categoryTotals,
    };

    res.status(200).json({
      success: true,
      count: expenses.length,
      totalAmount,
      categoryTotals,
      summary,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new store expense
// @route   POST /api/expenses
// @access  Private (Store Admin, Cashier)
const createExpense = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { category, title, amount, paymentMethod = 'Cash', date, notes } = req.body;

    if (!title || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid description and positive expense amount.',
      });
    }

    const parsedDate = date ? new Date(date) : new Date();

    if (global.useMemoryStore) {
      const newExpense = {
        _id: `exp_${Date.now()}`,
        tenantId,
        category: category || 'Miscellaneous',
        title: title.trim(),
        amount: Number(amount),
        paymentMethod,
        date: parsedDate,
        notes: (notes || '').trim(),
        recordedBy: req.user.name || 'Store Staff',
        createdAt: new Date(),
      };

      if (!memoryStore.expenses) {
        memoryStore.expenses = [];
      }
      memoryStore.expenses.unshift(newExpense);

      return res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        expense: newExpense,
      });
    }

    const expense = await Expense.create({
      tenantId,
      category: category || 'Miscellaneous',
      title: title.trim(),
      amount: Number(amount),
      paymentMethod,
      date: parsedDate,
      notes: (notes || '').trim(),
      recordedBy: req.user.name || 'Store Staff',
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense entry
// @route   DELETE /api/expenses/:id
// @access  Private (Store Admin only)
const deleteExpense = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    if (global.useMemoryStore) {
      const index = (memoryStore.expenses || []).findIndex(
        (e) => e._id === id && (!tenantId || e.tenantId === tenantId)
      );
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Expense record not found' });
      }
      memoryStore.expenses.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Expense entry deleted' });
    }

    const expense = await Expense.findOneAndDelete({ _id: id, tenantId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    res.status(200).json({ success: true, message: 'Expense entry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
