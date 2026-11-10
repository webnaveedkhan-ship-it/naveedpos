const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const Order = require('../models/Order');
const CustomerKhata = require('../models/CustomerKhata');
const Expense = require('../models/Expense');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const memoryStore = require('../config/memoryStore');
const { getPlanLimits } = require('../config/plans');

// @desc    Export full shop database snapshot (JSON backup)
// @route   GET /api/backup/export
// @access  Private (Store Admin only, Premium Plan)
const exportShopBackup = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    let tenant;
    if (global.useMemoryStore) {
      tenant = (memoryStore.tenants || []).find((t) => t._id === tenantId);
    } else {
      tenant = await Tenant.findById(tenantId);
    }

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store tenant not found' });
    }

    const limits = tenant.planLimits || getPlanLimits(tenant.plan);
    if (limits && limits.allowBackupExport === false) {
      return res.status(403).json({
        success: false,
        code: 'PLAN_LIMIT_REACHED',
        message:
          'One-Click Full Shop JSON/CSV Backup & Download is an exclusive Premium Supermart feature. Please upgrade your subscription plan.',
      });
    }

    let products = [];
    let orders = [];
    let khatas = [];
    let expenses = [];
    let suppliers = [];
    let purchases = [];

    if (global.useMemoryStore) {
      products = (memoryStore.products || []).filter((p) => p.tenantId === tenantId);
      orders = (memoryStore.orders || []).filter((o) => o.tenantId === tenantId);
      khatas = (memoryStore.khatas || []).filter((k) => k.tenantId === tenantId);
      expenses = (memoryStore.expenses || []).filter((e) => e.tenantId === tenantId);
      suppliers = (memoryStore.suppliers || []).filter((s) => s.tenantId === tenantId);
      purchases = (memoryStore.purchases || []).filter((p) => p.tenantId === tenantId);
    } else {
      [products, orders, khatas, expenses, suppliers, purchases] = await Promise.all([
        Product.find({ tenantId }),
        Order.find({ tenantId }).sort({ createdAt: -1 }),
        CustomerKhata.find({ tenantId }),
        Expense.find({ tenantId }),
        Supplier.find({ tenantId }),
        Purchase.find({ tenantId }),
      ]);
    }

    const backupData = {
      backupVersion: '1.0',
      exportedAt: new Date().toISOString(),
      store: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        ownerEmail: tenant.ownerEmail,
        plan: tenant.plan,
        currency: tenant.settings?.currency || 'PKR',
      },
      counts: {
        products: products.length,
        orders: orders.length,
        khataCustomers: khatas.length,
        expenses: expenses.length,
        suppliers: suppliers.length,
        purchases: purchases.length,
      },
      catalog: products,
      orders,
      khataLedgers: khatas,
      expenses,
      suppliers,
      wholesalePurchases: purchases,
    };

    const fileName = `naveedpos-backup-${tenant.slug || 'store'}-${new Date().toISOString().slice(0, 10)}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).json(backupData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportShopBackup,
};
