const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomerKhata = require('../models/CustomerKhata');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const Broadcast = require('../models/Broadcast');
const AuditLog = require('../models/AuditLog');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');
const CashDrawerReconciliation = require('../models/CashDrawerReconciliation');
const memoryStore = require('../config/memoryStore');
const { SUBSCRIPTION_PLANS, getPlanLimits } = require('../config/plans');

// Utility: Normalize phone number for 1-click WhatsApp wa.me link
const formatWhatsAppUrl = (phone) => {
  if (!phone) return null;
  let digits = phone.toString().replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '92' + digits.substring(1);
  } else if (digits.length === 10 && digits.startsWith('3')) {
    digits = '92' + digits;
  } else if (digits.startsWith('0092')) {
    digits = digits.substring(2);
  }
  return digits ? `https://wa.me/${digits}` : null;
};

// =========================================================================
// AUDIT LOG HELPER (Immutable Master Audit Trail)
// =========================================================================
const recordAuditLog = async ({
  actorId,
  actorName = 'Naveed (Platform Super Admin)',
  actorEmail = 'naveed@naveedpos.com',
  action,
  targetTenantId = null,
  targetTenantName = '',
  details = {},
  ipAddress = '',
  userAgent = '',
}) => {
  try {
    if (global.useMemoryStore) {
      if (!memoryStore.auditLogs) memoryStore.auditLogs = [];
      const entry = {
        _id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        actorId: actorId ? String(actorId) : 'usr_super_1',
        actorName,
        actorEmail,
        action,
        targetTenantId: targetTenantId ? String(targetTenantId) : null,
        targetTenantName,
        details,
        ipAddress,
        userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.auditLogs.unshift(entry);
      if (memoryStore.auditLogs.length > 500) {
        memoryStore.auditLogs = memoryStore.auditLogs.slice(0, 500);
      }
      return entry;
    }

    const log = await AuditLog.create({
      actorId,
      actorName,
      actorEmail,
      action,
      targetTenantId,
      targetTenantName,
      details,
      ipAddress,
      userAgent,
    });
    return log;
  } catch (err) {
    console.error('Failed to record Super Admin audit log:', err.message);
  }
};

// =========================================================================
// MODULE A: GLOBAL SAAS METRICS & FINANCIAL HEALTH
// =========================================================================
const getGlobalMetrics = async (req, res, next) => {
  try {
    const now = new Date();

    if (global.useMemoryStore) {
      const tenants = memoryStore.tenants || [];
      const orders = memoryStore.orders || [];
      const payments = memoryStore.subscriptionPayments || [];

      // Store Counts Breakdown
      const totalStores = tenants.length;
      const activePaidStores = tenants.filter(
        (t) =>
          t.status === 'active' &&
          ['basic', 'standard', 'premium', 'monthly', 'yearly'].includes(t.plan)
      ).length;
      const trialStores = tenants.filter((t) => t.status === 'trial' || t.plan === 'trial').length;
      const suspendedStores = tenants.filter((t) => t.status === 'suspended').length;
      const expiredStores = tenants.filter(
        (t) =>
          t.status === 'expired' ||
          (t.subscriptionExpiresAt && new Date(t.subscriptionExpiresAt) < now)
      ).length;

      // Platform Transaction Volume (GMV)
      const gmv = orders.reduce((sum, o) => sum + Number(o.grandTotal || o.total || 0), 0);
      const totalBillsIssued = orders.length;

      // Pending Payment Approvals Badge Counter
      const pendingPaymentsCount = payments.filter((p) => p.status === 'pending').length;

      // Monthly Recurring Revenue (MRR) Calculation (PKR)
      // Basic: Rs. 1,500/mo | Standard: Rs. 3,000/mo | Premium: Rs. 5,500/mo
      let mrr = 0;
      let basicSubscribers = 0;
      let standardSubscribers = 0;
      let premiumSubscribers = 0;

      tenants.forEach((t) => {
        if (t.status === 'active' && new Date(t.subscriptionExpiresAt) > now) {
          const plan = (t.plan || '').toLowerCase();
          if (plan === 'basic') {
            mrr += 1500;
            basicSubscribers += 1;
          } else if (plan === 'standard' || plan === 'monthly') {
            mrr += 3000;
            standardSubscribers += 1;
          } else if (plan === 'premium' || plan === 'yearly') {
            mrr += 5500;
            premiumSubscribers += 1;
          }
        }
      });

      return res.status(200).json({
        success: true,
        metrics: {
          mrr,
          mrrFormatted: `Rs. ${mrr.toLocaleString('en-PK')}`,
          stores: {
            total: totalStores,
            activePaid: activePaidStores,
            trial: trialStores,
            expired: expiredStores,
            suspended: suspendedStores,
          },
          gmv: Math.round(gmv * 100) / 100,
          gmvFormatted: `Rs. ${Math.round(gmv).toLocaleString('en-PK')}`,
          totalBillsIssued,
          pendingPaymentsCount,
          subscribersBreakdown: {
            basic: basicSubscribers,
            standard: standardSubscribers,
            premium: premiumSubscribers,
          },
        },
      });
    }

    // MongoDB Production Aggregation
    const [
      totalStores,
      activePaidStores,
      trialStores,
      suspendedStores,
      expiredStores,
      ordersAgg,
      pendingPaymentsCount,
      tenantsList,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({
        status: 'active',
        plan: { $in: ['basic', 'standard', 'premium', 'monthly', 'yearly'] },
      }),
      Tenant.countDocuments({ $or: [{ status: 'trial' }, { plan: 'trial' }] }),
      Tenant.countDocuments({ status: 'suspended' }),
      Tenant.countDocuments({
        $or: [{ status: 'expired' }, { subscriptionExpiresAt: { $lt: now } }],
      }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalGMV: { $sum: '$grandTotal' },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      SubscriptionPayment.countDocuments({ status: 'pending' }),
      Tenant.find({ status: 'active', subscriptionExpiresAt: { $gt: now } }).select('plan'),
    ]);

    const gmv = ordersAgg[0]?.totalGMV || 0;
    const totalBillsIssued = ordersAgg[0]?.totalOrders || 0;

    let mrr = 0;
    let basicSubscribers = 0;
    let standardSubscribers = 0;
    let premiumSubscribers = 0;

    tenantsList.forEach((t) => {
      const plan = (t.plan || '').toLowerCase();
      if (plan === 'basic') {
        mrr += 1500;
        basicSubscribers += 1;
      } else if (plan === 'standard' || plan === 'monthly') {
        mrr += 3000;
        standardSubscribers += 1;
      } else if (plan === 'premium' || plan === 'yearly') {
        mrr += 5500;
        premiumSubscribers += 1;
      }
    });

    res.status(200).json({
      success: true,
      metrics: {
        mrr,
        mrrFormatted: `Rs. ${mrr.toLocaleString('en-PK')}`,
        stores: {
          total: totalStores,
          activePaid: activePaidStores,
          trial: trialStores,
          expired: expiredStores,
          suspended: suspendedStores,
        },
        gmv: Math.round(gmv * 100) / 100,
        gmvFormatted: `Rs. ${Math.round(gmv).toLocaleString('en-PK')}`,
        totalBillsIssued,
        pendingPaymentsCount,
        subscribersBreakdown: {
          basic: basicSubscribers,
          standard: standardSubscribers,
          premium: premiumSubscribers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// MODULE B: TENANT MANAGEMENT DIRECTORY & ACTIONS
// =========================================================================
const getTenantsDirectory = async (req, res, next) => {
  try {
    const { search = '', status = 'all', plan = 'all' } = req.query;
    const now = new Date();

    if (global.useMemoryStore) {
      let list = [...(memoryStore.tenants || [])];

      // Filter search
      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.slug.toLowerCase().includes(q) ||
            (t.ownerEmail && t.ownerEmail.toLowerCase().includes(q)) ||
            (t.phone && t.phone.includes(q)) ||
            (t.city && t.city.toLowerCase().includes(q))
        );
      }

      // Filter status
      if (status && status !== 'all') {
        if (status === 'expired') {
          list = list.filter(
            (t) =>
              t.status === 'expired' ||
              (t.subscriptionExpiresAt && new Date(t.subscriptionExpiresAt) < now)
          );
        } else {
          list = list.filter((t) => t.status === status);
        }
      }

      // Filter plan
      if (plan && plan !== 'all') {
        list = list.filter((t) => (t.plan || 'trial').toLowerCase() === plan.toLowerCase());
      }

      // Calculate usage metrics per store
      const tenantsWithUsage = list.map((t) => {
        const productsCount = (memoryStore.products || []).filter(
          (p) => p.tenantId === t._id && p.status === 'active'
        ).length;
        const khatasCount = (memoryStore.khatas || []).filter((k) => k.tenantId === t._id).length;
        const orders = (memoryStore.orders || []).filter((o) => o.tenantId === t._id);
        const ordersCount = orders.length;
        const totalSales = orders.reduce((sum, o) => sum + Number(o.grandTotal || o.total || 0), 0);

        // Expiry calculations
        const expiry = t.subscriptionExpiresAt ? new Date(t.subscriptionExpiresAt) : null;
        const msRemaining = expiry ? expiry.getTime() - now.getTime() : 0;
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

        let expiryStatus = 'Active';
        let expiryCountdownText = '';
        if (!expiry) {
          expiryCountdownText = 'No Expiry';
        } else if (daysRemaining > 0) {
          expiryCountdownText = `${daysRemaining} days left`;
        } else if (daysRemaining === 0) {
          expiryCountdownText = 'Expires Today';
          expiryStatus = 'Expired';
        } else {
          expiryCountdownText = `Expired ${Math.abs(daysRemaining)} days ago`;
          expiryStatus = 'Expired';
        }

        const limits = t.planLimits || getPlanLimits(t.plan);
        const maxProd = limits.maxProducts >= 99999 ? 'Unlimited' : limits.maxProducts;
        const maxKhata = limits.maxKhataCustomers >= 99999 ? 'Unlimited' : limits.maxKhataCustomers;

        return {
          _id: t._id,
          name: t.name,
          slug: t.slug,
          ownerEmail: t.ownerEmail,
          phone: t.phone || '',
          whatsappUrl: formatWhatsAppUrl(t.phone),
          city: t.city || 'Islamabad',
          status: t.status,
          plan: t.plan || 'trial',
          planLimits: limits,
          subscriptionExpiresAt: t.subscriptionExpiresAt,
          daysRemaining,
          expiryCountdownText,
          expiryStatus,
          isExpired: daysRemaining < 0,
          usage: {
            products: productsCount,
            maxProducts: maxProd,
            productsUsageText: `${productsCount} / ${maxProd} products`,
            productsPercentage:
              typeof maxProd === 'number'
                ? Math.min(100, Math.round((productsCount / maxProd) * 100))
                : 0,
            khatas: khatasCount,
            maxKhatas: maxKhata,
            khatasUsageText: `${khatasCount} / ${maxKhata} khata accounts`,
            khatasPercentage:
              typeof maxKhata === 'number'
                ? Math.min(100, Math.round((khatasCount / maxKhata) * 100))
                : 0,
            ordersCount,
            totalSales: Math.round(totalSales * 100) / 100,
          },
          createdAt: t.createdAt || now,
        };
      });

      return res.status(200).json({
        success: true,
        count: tenantsWithUsage.length,
        tenants: tenantsWithUsage,
      });
    }

    // MongoDB Pipeline
    const query = {};
    if (search && search.trim() !== '') {
      const q = search.trim();
      query.$or = [
        { name: new RegExp(q, 'i') },
        { slug: new RegExp(q, 'i') },
        { ownerEmail: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
      ];
    }
    if (status && status !== 'all') {
      if (status === 'expired') {
        query.$or = [{ status: 'expired' }, { subscriptionExpiresAt: { $lt: now } }];
      } else {
        query.status = status;
      }
    }
    if (plan && plan !== 'all') {
      query.plan = plan;
    }

    const tenants = await Tenant.find(query).sort({ createdAt: -1 });

    const tenantsWithUsage = await Promise.all(
      tenants.map(async (t) => {
        const [productsCount, khatasCount, ordersAgg] = await Promise.all([
          Product.countDocuments({ tenantId: t._id, status: 'active' }),
          CustomerKhata.countDocuments({ tenantId: t._id }),
          Order.aggregate([
            { $match: { tenantId: t._id, status: 'completed' } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSales: { $sum: '$grandTotal' },
              },
            },
          ]),
        ]);

        const ordersCount = ordersAgg[0]?.totalOrders || 0;
        const totalSales = ordersAgg[0]?.totalSales || 0;

        const expiry = t.subscriptionExpiresAt ? new Date(t.subscriptionExpiresAt) : null;
        const msRemaining = expiry ? expiry.getTime() - now.getTime() : 0;
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

        let expiryCountdownText = '';
        let expiryStatus = 'Active';
        if (!expiry) {
          expiryCountdownText = 'No Expiry';
        } else if (daysRemaining > 0) {
          expiryCountdownText = `${daysRemaining} days left`;
        } else if (daysRemaining === 0) {
          expiryCountdownText = 'Expires Today';
          expiryStatus = 'Expired';
        } else {
          expiryCountdownText = `Expired ${Math.abs(daysRemaining)} days ago`;
          expiryStatus = 'Expired';
        }

        const limits = t.planLimits || getPlanLimits(t.plan);
        const maxProd = limits.maxProducts >= 99999 ? 'Unlimited' : limits.maxProducts;
        const maxKhata = limits.maxKhataCustomers >= 99999 ? 'Unlimited' : limits.maxKhataCustomers;

        return {
          _id: t._id,
          name: t.name,
          slug: t.slug,
          ownerEmail: t.ownerEmail,
          phone: t.phone || '',
          whatsappUrl: formatWhatsAppUrl(t.phone),
          city: t.city || 'Islamabad',
          status: t.status,
          plan: t.plan || 'trial',
          planLimits: limits,
          subscriptionExpiresAt: t.subscriptionExpiresAt,
          daysRemaining,
          expiryCountdownText,
          expiryStatus,
          isExpired: daysRemaining < 0,
          usage: {
            products: productsCount,
            maxProducts: maxProd,
            productsUsageText: `${productsCount} / ${maxProd} products`,
            productsPercentage:
              typeof maxProd === 'number'
                ? Math.min(100, Math.round((productsCount / maxProd) * 100))
                : 0,
            khatas: khatasCount,
            maxKhatas: maxKhata,
            khatasUsageText: `${khatasCount} / ${maxKhata} khata accounts`,
            khatasPercentage:
              typeof maxKhata === 'number'
                ? Math.min(100, Math.round((khatasCount / maxKhata) * 100))
                : 0,
            ordersCount,
            totalSales: Math.round(totalSales * 100) / 100,
          },
          createdAt: t.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tenantsWithUsage.length,
      tenants: tenantsWithUsage,
    });
  } catch (error) {
    next(error);
  }
};

// Create New Tenant Manually (Master Super Admin)
const createTenant = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      ownerName,
      ownerEmail,
      ownerPassword,
      phone,
      city = 'Islamabad',
      address = '',
      subscriptionMonths = 12,
      plan = 'standard',
    } = req.body;

    if (!name || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        success: false,
        message: 'Shop name, owner email, and password are required',
      });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const months = Number(subscriptionMonths) || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const normalizedPlan = (plan || 'standard').toLowerCase();
    const limits = getPlanLimits(normalizedPlan);

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    if (global.useMemoryStore) {
      const existing = (memoryStore.tenants || []).find(
        (t) => t.slug === generatedSlug || t.ownerEmail === ownerEmail.toLowerCase()
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A store with this name/slug or owner email already exists',
        });
      }

      const tenantId = `tenant_${Date.now()}`;
      const newTenant = {
        _id: tenantId,
        name: name.trim(),
        slug: generatedSlug,
        ownerEmail: ownerEmail.toLowerCase().trim(),
        phone: phone || '',
        city,
        status: 'active',
        plan: normalizedPlan,
        planLimits: limits,
        subscriptionExpiresAt: expiresAt,
        maxUsers: 5,
        maxProducts: limits.maxProducts,
        settings: {
          currency: 'PKR',
          currencySymbol: 'Rs.',
          taxRate: 0,
          receiptHeader: name.trim(),
          address,
          receiptFooter: 'Thank you for your business!',
          phone: phone || '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newUser = {
        _id: `usr_${Date.now()}`,
        name: ownerName || name.trim(),
        email: ownerEmail.toLowerCase().trim(),
        password: hashedPassword,
        role: 'STORE_ADMIN',
        tenantId,
        status: 'active',
        isActive: true,
        phone: phone || '',
        createdAt: new Date(),
        matchPassword: async function (p) {
          return bcrypt.compare(p, this.password);
        },
      };

      if (!memoryStore.tenants) memoryStore.tenants = [];
      if (!memoryStore.users) memoryStore.users = [];
      memoryStore.tenants.unshift(newTenant);
      memoryStore.users.push(newUser);

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'STORE_ACTIVATED',
        targetTenantId: newTenant._id,
        targetTenantName: newTenant.name,
        details: { plan: normalizedPlan, months, ownerEmail: newTenant.ownerEmail },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: `Store "${newTenant.name}" created successfully with ${months}-month ${normalizedPlan.toUpperCase()} license.`,
        tenant: newTenant,
      });
    }

    const existing = await Tenant.findOne({
      $or: [{ slug: generatedSlug }, { ownerEmail: ownerEmail.toLowerCase() }],
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A store with this name/slug or owner email already exists',
      });
    }

    const tenant = await Tenant.create({
      name: name.trim(),
      slug: generatedSlug,
      ownerEmail: ownerEmail.toLowerCase().trim(),
      phone: phone || '',
      city,
      status: 'active',
      plan: normalizedPlan,
      planLimits: limits,
      subscriptionExpiresAt: expiresAt,
      maxUsers: 5,
      maxProducts: limits.maxProducts,
      settings: {
        currency: 'PKR',
        currencySymbol: 'Rs.',
        taxRate: 0,
        receiptHeader: name.trim(),
        address,
        receiptFooter: 'Thank you for your business!',
        phone: phone || '',
      },
    });

    await User.create({
      name: ownerName || name.trim(),
      email: ownerEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: 'STORE_ADMIN',
      tenantId: tenant._id,
      status: 'active',
      isActive: true,
      phone: phone || '',
    });

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'STORE_ACTIVATED',
      targetTenantId: tenant._id,
      targetTenantName: tenant.name,
      details: { plan: normalizedPlan, months, ownerEmail: tenant.ownerEmail },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Store "${tenant.name}" created successfully with ${months}-month ${normalizedPlan.toUpperCase()} license.`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// Override Plan / Tier & Custom Resource Limits
const updateTenantPlanAndLimits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan, customLimits, extendDays = 30 } = req.body;

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Subscription plan is required' });
    }

    const normalizedPlan = plan.toLowerCase();
    const standardLimits = getPlanLimits(normalizedPlan);
    const mergedLimits = {
      ...standardLimits,
      ...(customLimits || {}),
    };

    if (global.useMemoryStore) {
      const tenant = memoryStore.tenants.find((t) => t._id === id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found' });
      }

      const prevPlan = tenant.plan;
      tenant.plan = normalizedPlan;
      tenant.planLimits = mergedLimits;
      tenant.status = 'active';

      if (extendDays && Number(extendDays) > 0) {
        const current = tenant.subscriptionExpiresAt
          ? new Date(tenant.subscriptionExpiresAt)
          : new Date();
        const baseDate = current > new Date() ? current : new Date();
        baseDate.setDate(baseDate.getDate() + Number(extendDays));
        tenant.subscriptionExpiresAt = baseDate;
      }

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'PLAN_OVERRIDE',
        targetTenantId: tenant._id,
        targetTenantName: tenant.name,
        details: {
          previousPlan: prevPlan,
          newPlan: normalizedPlan,
          limits: mergedLimits,
          extendDays,
          newExpiry: tenant.subscriptionExpiresAt,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
        message: `Plan updated to ${normalizedPlan.toUpperCase()}. Resource limits successfully synchronized.`,
        tenant,
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store tenant not found' });
    }

    const prevPlan = tenant.plan;
    tenant.plan = normalizedPlan;
    tenant.planLimits = mergedLimits;
    tenant.status = 'active';

    if (extendDays && Number(extendDays) > 0) {
      const current = tenant.subscriptionExpiresAt
        ? new Date(tenant.subscriptionExpiresAt)
        : new Date();
      const baseDate = current > new Date() ? current : new Date();
      baseDate.setDate(baseDate.getDate() + Number(extendDays));
      tenant.subscriptionExpiresAt = baseDate;
    }

    await tenant.save();

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'PLAN_OVERRIDE',
      targetTenantId: tenant._id,
      targetTenantName: tenant.name,
      details: {
        previousPlan: prevPlan,
        newPlan: normalizedPlan,
        limits: mergedLimits,
        extendDays,
        newExpiry: tenant.subscriptionExpiresAt,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Plan updated to ${normalizedPlan.toUpperCase()}. Resource limits successfully synchronized.`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// Quick Extend Subscription (+7, +14, +30, +365 days)
const quickExtendSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.body;

    const daysToAdd = Number(days);
    if (isNaN(daysToAdd) || daysToAdd <= 0) {
      return res.status(400).json({ success: false, message: 'Valid extension days required' });
    }

    if (global.useMemoryStore) {
      const tenant = memoryStore.tenants.find((t) => t._id === id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found' });
      }

      const current = tenant.subscriptionExpiresAt
        ? new Date(tenant.subscriptionExpiresAt)
        : new Date();
      const baseDate = current > new Date() ? current : new Date();
      baseDate.setDate(baseDate.getDate() + daysToAdd);

      tenant.subscriptionExpiresAt = baseDate;
      if (tenant.status === 'expired') {
        tenant.status = 'active';
      }

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'SUBSCRIPTION_EXTENDED',
        targetTenantId: tenant._id,
        targetTenantName: tenant.name,
        details: {
          daysAdded: daysToAdd,
          newExpiry: baseDate,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
        message: `Store license extended by +${daysToAdd} days. New expiry: ${baseDate.toLocaleDateString('en-PK')}`,
        subscriptionExpiresAt: baseDate,
        tenant,
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store tenant not found' });
    }

    const current = tenant.subscriptionExpiresAt
      ? new Date(tenant.subscriptionExpiresAt)
      : new Date();
    const baseDate = current > new Date() ? current : new Date();
    baseDate.setDate(baseDate.getDate() + daysToAdd);

    tenant.subscriptionExpiresAt = baseDate;
    if (tenant.status === 'expired') {
      tenant.status = 'active';
    }

    await tenant.save();

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'SUBSCRIPTION_EXTENDED',
      targetTenantId: tenant._id,
      targetTenantName: tenant.name,
      details: {
        daysAdded: daysToAdd,
        newExpiry: baseDate,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Store license extended by +${daysToAdd} days. New expiry: ${baseDate.toLocaleDateString('en-PK')}`,
      subscriptionExpiresAt: baseDate,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Suspension (Lock store out of POS billing)
const toggleStoreSuspension = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'suspended'

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'suspended'",
      });
    }

    if (global.useMemoryStore) {
      const tenant = memoryStore.tenants.find((t) => t._id === id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found' });
      }
      tenant.status = status;

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: status === 'suspended' ? 'STORE_SUSPENDED' : 'STORE_ACTIVATED',
        targetTenantId: tenant._id,
        targetTenantName: tenant.name,
        details: { status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
        message:
          status === 'suspended'
            ? `Store "${tenant.name}" has been locked and suspended from POS billing.`
            : `Store "${tenant.name}" has been unlocked and restored to Active status.`,
        tenant,
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store tenant not found' });
    }

    tenant.status = status;
    await tenant.save();

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: status === 'suspended' ? 'STORE_SUSPENDED' : 'STORE_ACTIVATED',
      targetTenantId: tenant._id,
      targetTenantName: tenant.name,
      details: { status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message:
        status === 'suspended'
          ? `Store "${tenant.name}" has been locked and suspended from POS billing.`
          : `Store "${tenant.name}" has been unlocked and restored to Active status.`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// Impersonate Store ("Login as Shop")
const impersonateStore = async (req, res, next) => {
  try {
    const { id } = req.params;

    let tenant;
    let storeAdminUser;

    if (global.useMemoryStore) {
      tenant = memoryStore.tenants.find((t) => t._id === id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found' });
      }

      storeAdminUser = memoryStore.users.find(
        (u) => u.tenantId === id && (u.role === 'STORE_ADMIN' || u.role === 'ADMIN')
      );

      if (!storeAdminUser) {
        storeAdminUser = {
          _id: `usr_impersonated_${Date.now()}`,
          name: `${tenant.name} Owner (Impersonated)`,
          email: tenant.ownerEmail,
          tenantId: tenant._id,
          role: 'STORE_ADMIN',
          status: 'active',
          isActive: true,
        };
      }
    } else {
      tenant = await Tenant.findById(id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found' });
      }

      storeAdminUser = await User.findOne({ tenantId: id, role: 'STORE_ADMIN' });
      if (!storeAdminUser) {
        storeAdminUser = await User.findOne({ tenantId: id });
      }
      if (!storeAdminUser) {
        return res.status(404).json({
          success: false,
          message: 'No administrative user account found for this store to impersonate.',
        });
      }
    }

    // Generate scoped JWT token
    const token = jwt.sign(
      {
        id: storeAdminUser._id,
        tenantId: tenant._id,
        role: storeAdminUser.role,
        isImpersonated: true,
        impersonatedBy: (req.user?._id || req.user?.id || 'usr_super_1'),
      },
      process.env.JWT_SECRET || 'naveedpos_super_secret_jwt_key_2026_production',
      { expiresIn: '4h' }
    );

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'IMPERSONATION_STARTED',
      targetTenantId: tenant._id,
      targetTenantName: tenant.name,
      details: { targetUser: storeAdminUser.email, role: storeAdminUser.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Impersonation session established for "${tenant.name}".`,
      token,
      user: {
        _id: storeAdminUser._id,
        name: storeAdminUser.name,
        email: storeAdminUser.email,
        role: storeAdminUser.role,
        tenantId: tenant._id,
        storeName: tenant.name,
        isImpersonated: true,
      },
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Hard Reset / Data Purge (Wipes transactional data while preserving owner credentials and tenant structure)
const purgeTenantData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirmation, purgeProducts = false } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation is required to purge store transactional data.',
      });
    }

    if (global.useMemoryStore) {
      const tenant = (memoryStore.tenants || []).find((t) => t._id === id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found' });
      }

      const confStr = String(confirmation).trim().toLowerCase();
      if (
        confStr !== 'purge' &&
        confStr !== tenant.name.toLowerCase() &&
        confStr !== tenant.slug.toLowerCase()
      ) {
        return res.status(400).json({
          success: false,
          message: `Confirmation text must match "PURGE" or "${tenant.name}".`,
        });
      }

      const ordersCount = (memoryStore.orders || []).filter((o) => o.tenantId === id).length;
      const expensesCount = (memoryStore.expenses || []).filter((e) => e.tenantId === id).length;
      const purchasesCount = (memoryStore.purchases || []).filter((p) => p.tenantId === id).length;
      const khatasCount = (memoryStore.khatas || []).filter((k) => k.tenantId === id).length;
      const cashCount = (memoryStore.cashReconciliations || []).filter((c) => c.tenantId === id).length;

      // Wipe transactional data
      memoryStore.orders = (memoryStore.orders || []).filter((o) => o.tenantId !== id);
      memoryStore.expenses = (memoryStore.expenses || []).filter((e) => e.tenantId !== id);
      memoryStore.purchases = (memoryStore.purchases || []).filter((p) => p.tenantId !== id);
      memoryStore.khatas = (memoryStore.khatas || []).filter((k) => k.tenantId !== id);
      memoryStore.cashReconciliations = (memoryStore.cashReconciliations || []).filter(
        (c) => c.tenantId !== id
      );

      let productsPurged = 0;
      if (purgeProducts) {
        productsPurged = (memoryStore.products || []).filter((p) => p.tenantId === id).length;
        memoryStore.products = (memoryStore.products || []).filter((p) => p.tenantId !== id);
      }

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'DATA_PURGED',
        targetTenantId: tenant._id,
        targetTenantName: tenant.name,
        details: {
          ordersPurged: ordersCount,
          expensesPurged: expensesCount,
          purchasesPurged: purchasesCount,
          khatasPurged: khatasCount,
          cashReconciliationsPurged: cashCount,
          productsPurged,
          ownerPreserved: tenant.ownerEmail,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
        message: `Transactional data for "${tenant.name}" has been wiped clean. Store owner account and credentials preserved.`,
        purgedSummary: {
          ordersPurged: ordersCount,
          expensesPurged: expensesCount,
          purchasesPurged: purchasesCount,
          khatasPurged: khatasCount,
          cashReconciliationsPurged: cashCount,
          productsPurged,
        },
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store tenant not found' });
    }

    const confStr = String(confirmation).trim().toLowerCase();
    if (
      confStr !== 'purge' &&
      confStr !== tenant.name.toLowerCase() &&
      confStr !== tenant.slug.toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        message: `Confirmation text must match "PURGE" or "${tenant.name}".`,
      });
    }

    const [ordersRes, expensesRes, purchasesRes, khatasRes, cashRes] = await Promise.all([
      Order.deleteMany({ tenantId: id }),
      Expense.deleteMany({ tenantId: id }),
      Purchase.deleteMany({ tenantId: id }),
      CustomerKhata.deleteMany({ tenantId: id }),
      CashDrawerReconciliation.deleteMany({ tenantId: id }),
    ]);

    let productsPurged = 0;
    if (purgeProducts) {
      const prodRes = await Product.deleteMany({ tenantId: id });
      productsPurged = prodRes.deletedCount;
    }

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'DATA_PURGED',
      targetTenantId: tenant._id,
      targetTenantName: tenant.name,
      details: {
        ordersPurged: ordersRes.deletedCount,
        expensesPurged: expensesRes.deletedCount,
        purchasesPurged: purchasesRes.deletedCount,
        khatasPurged: khatasRes.deletedCount,
        cashReconciliationsPurged: cashRes.deletedCount,
        productsPurged,
        ownerPreserved: tenant.ownerEmail,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Transactional data for "${tenant.name}" has been wiped clean. Store owner account and credentials preserved.`,
      purgedSummary: {
        ordersPurged: ordersRes.deletedCount,
        expensesPurged: expensesRes.deletedCount,
        purchasesPurged: purchasesRes.deletedCount,
        khatasPurged: khatasRes.deletedCount,
        cashReconciliationsPurged: cashRes.deletedCount,
        productsPurged,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Permanent Tenant Delete
const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (global.useMemoryStore) {
      const tenant = (memoryStore.tenants || []).find((t) => t._id === id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found' });
      }

      memoryStore.tenants = memoryStore.tenants.filter((t) => t._id !== id);
      memoryStore.users = (memoryStore.users || []).filter((u) => u.tenantId !== id);
      memoryStore.products = (memoryStore.products || []).filter((p) => p.tenantId !== id);
      memoryStore.orders = (memoryStore.orders || []).filter((o) => o.tenantId !== id);
      memoryStore.khatas = (memoryStore.khatas || []).filter((k) => k.tenantId !== id);
      memoryStore.expenses = (memoryStore.expenses || []).filter((e) => e.tenantId !== id);
      memoryStore.purchases = (memoryStore.purchases || []).filter((p) => p.tenantId !== id);
      memoryStore.cashReconciliations = (memoryStore.cashReconciliations || []).filter(
        (c) => c.tenantId !== id
      );

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'DATA_PURGED',
        targetTenantId: id,
        targetTenantName: tenant.name,
        details: { action: 'FULL_STORE_DELETION', deletedAt: new Date() },
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: `Store "${tenant.name}" and all associated data permanently removed.`,
      });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Store tenant not found' });
    }

    await Promise.all([
      Tenant.findByIdAndDelete(id),
      User.deleteMany({ tenantId: id }),
      Product.deleteMany({ tenantId: id }),
      Order.deleteMany({ tenantId: id }),
      CustomerKhata.deleteMany({ tenantId: id }),
      Expense.deleteMany({ tenantId: id }),
      Purchase.deleteMany({ tenantId: id }),
      CashDrawerReconciliation.deleteMany({ tenantId: id }),
    ]);

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'DATA_PURGED',
      targetTenantId: id,
      targetTenantName: tenant.name,
      details: { action: 'FULL_STORE_DELETION', deletedAt: new Date() },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Store "${tenant.name}" and all associated data permanently removed.`,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// MODULE C: SUBSCRIPTION PAYMENT APPROVAL QUEUE
// =========================================================================
const getPaymentQueue = async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;

    if (global.useMemoryStore) {
      let payments = [...(memoryStore.subscriptionPayments || [])];
      if (status && status !== 'all') {
        payments = payments.filter((p) => p.status === status);
      }
      payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Attach tenant details if missing
      const enriched = payments.map((p) => {
        const t = (memoryStore.tenants || []).find((ten) => ten._id === p.tenantId);
        return {
          ...p,
          tenantName: p.storeName || t?.name || 'NaveedPOS Store',
          tenantPhone: t?.phone || '',
          whatsappUrl: formatWhatsAppUrl(t?.phone),
          receiptImageUrl: p.receiptImageUrl || p.receiptUrl || '',
        };
      });

      return res.status(200).json({
        success: true,
        count: enriched.length,
        payments: enriched,
      });
    }

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const payments = await SubscriptionPayment.find(query)
      .populate('tenantId', 'name slug phone ownerEmail plan subscriptionExpiresAt')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    const enriched = payments.map((p) => {
      const pObj = p.toObject();
      return {
        ...pObj,
        tenantName: pObj.storeName || pObj.tenantId?.name || 'Retail Store',
        tenantPhone: pObj.tenantId?.phone || '',
        whatsappUrl: formatWhatsAppUrl(pObj.tenantId?.phone),
        receiptImageUrl: pObj.receiptImageUrl || pObj.receiptUrl || '',
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      payments: enriched,
    });
  } catch (error) {
    next(error);
  }
};

const approvePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (global.useMemoryStore) {
      const payment = (memoryStore.subscriptionPayments || []).find((p) => p._id === id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      if (payment.status === 'approved') {
        return res.status(400).json({ success: false, message: 'Payment has already been approved' });
      }

      const tenant = memoryStore.tenants.find((t) => t._id === payment.tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Associated store tenant not found' });
      }

      // 1. Shift subscription forward by 30 days (or 365 days if annual)
      const extensionDays = payment.billingCycle === 'yearly' ? 365 : 30;
      const currentExpiry = tenant.subscriptionExpiresAt
        ? new Date(tenant.subscriptionExpiresAt)
        : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + extensionDays);

      tenant.subscriptionExpiresAt = baseDate;
      tenant.status = 'active';

      // 2. Apply target plan limits
      const targetPlan = (payment.plan || tenant.plan || 'standard').toLowerCase();
      tenant.plan = targetPlan;
      tenant.planLimits = getPlanLimits(targetPlan);

      // 3. Mark payment as approved
      payment.status = 'approved';
      payment.reviewedBy = (req.user?._id || req.user?.id || 'usr_super_1');
      payment.reviewedByName = (req.user?.name || 'Naveed (Super Admin)') || 'Naveed';
      payment.reviewedAt = new Date();

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'PAYMENT_APPROVED',
        targetTenantId: tenant._id,
        targetTenantName: tenant.name,
        details: {
          paymentId: payment._id,
          amount: payment.amount,
          plan: targetPlan,
          extensionDays,
          method: payment.paymentMethod,
          tid: payment.transactionId || payment.referenceNumber,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
        message: `Payment of Rs. ${payment.amount?.toLocaleString('en-PK')} verified & approved. Store subscription extended by +${extensionDays} days.`,
        payment,
        tenant,
      });
    }

    const payment = await SubscriptionPayment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Payment has already been approved' });
    }

    const tenant = await Tenant.findById(payment.tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Associated store tenant not found' });
    }

    const extensionDays = payment.billingCycle === 'yearly' ? 365 : 30;
    const currentExpiry = tenant.subscriptionExpiresAt
      ? new Date(tenant.subscriptionExpiresAt)
      : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setDate(baseDate.getDate() + extensionDays);

    tenant.subscriptionExpiresAt = baseDate;
    tenant.status = 'active';

    const targetPlan = (payment.plan || tenant.plan || 'standard').toLowerCase();
    tenant.plan = targetPlan;
    tenant.planLimits = getPlanLimits(targetPlan);

    payment.status = 'approved';
    payment.reviewedBy = (req.user?._id || req.user?.id || 'usr_super_1');
    payment.reviewedByName = (req.user?.name || 'Naveed (Super Admin)') || 'Naveed';
    payment.reviewedAt = new Date();

    await Promise.all([tenant.save(), payment.save()]);

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'PAYMENT_APPROVED',
      targetTenantId: tenant._id,
      targetTenantName: tenant.name,
      details: {
        paymentId: payment._id,
        amount: payment.amount,
        plan: targetPlan,
        extensionDays,
        method: payment.paymentMethod,
        tid: payment.transactionId || payment.referenceNumber,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Payment of Rs. ${payment.amount?.toLocaleString('en-PK')} verified & approved. Store subscription extended by +${extensionDays} days.`,
      payment,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

const rejectPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Transaction reference / ID not found in bank statement.' } = req.body;

    if (global.useMemoryStore) {
      const payment = (memoryStore.subscriptionPayments || []).find((p) => p._id === id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      payment.status = 'rejected';
      payment.rejectionReason = reason;
      payment.reviewedBy = (req.user?._id || req.user?.id || 'usr_super_1');
      payment.reviewedByName = (req.user?.name || 'Naveed (Super Admin)') || 'Naveed';
      payment.reviewedAt = new Date();

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'PAYMENT_REJECTED',
        targetTenantId: payment.tenantId,
        targetTenantName: payment.storeName || '',
        details: {
          paymentId: payment._id,
          amount: payment.amount,
          reason,
          method: payment.paymentMethod,
          tid: payment.transactionId || payment.referenceNumber,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
        message: 'Payment verification proof rejected. Note recorded for store billing.',
        payment,
      });
    }

    const payment = await SubscriptionPayment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    payment.status = 'rejected';
    payment.rejectionReason = reason;
    payment.reviewedBy = (req.user?._id || req.user?.id || 'usr_super_1');
    payment.reviewedByName = (req.user?.name || 'Naveed (Super Admin)') || 'Naveed';
    payment.reviewedAt = new Date();

    await payment.save();

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'PAYMENT_REJECTED',
      targetTenantId: payment.tenantId,
      targetTenantName: payment.storeName || '',
      details: {
        paymentId: payment._id,
        amount: payment.amount,
        reason,
        method: payment.paymentMethod,
        tid: payment.transactionId || payment.referenceNumber,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Payment verification proof rejected. Note recorded for store billing.',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

const reviewPayment = async (req, res, next) => {
  const { action } = req.body;
  if (action === 'approve') {
    return approvePayment(req, res, next);
  } else if (action === 'reject') {
    return rejectPayment(req, res, next);
  } else {
    return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject"' });
  }
};

// =========================================================================
// MODULE D: GLOBAL SYSTEM BROADCAST NOTIFICATIONS
// =========================================================================
const getBroadcasts = async (req, res, next) => {
  try {
    if (global.useMemoryStore) {
      const list = memoryStore.broadcasts || [];
      return res.status(200).json({ success: true, count: list.length, broadcasts: list });
    }

    const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: broadcasts.length, broadcasts });
  } catch (error) {
    next(error);
  }
};

const createOrUpdateBroadcast = async (req, res, next) => {
  try {
    const {
      title,
      message,
      type = 'info',
      targetAudience = 'ALL',
      isActive = true,
      expiresAt,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Broadcast title and message announcement are required',
      });
    }

    if (global.useMemoryStore) {
      if (isActive) {
        (memoryStore.broadcasts || []).forEach((b) => (b.isActive = false));
      }

      const newBcast = {
        _id: `bcast_${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        type,
        targetAudience,
        isActive: Boolean(isActive),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: (req.user?._id || req.user?.id || 'usr_super_1'),
        createdByName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (!memoryStore.broadcasts) memoryStore.broadcasts = [];
      memoryStore.broadcasts.unshift(newBcast);

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'BROADCAST_PUBLISHED',
        details: {
          title,
          type,
          targetAudience,
          isActive,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(201).json({
        success: true,
        message: 'Global system announcement broadcasted successfully.',
        broadcast: newBcast,
      });
    }

    if (isActive) {
      await Broadcast.updateMany({ isActive: true }, { isActive: false });
    }

    const broadcast = await Broadcast.create({
      title: title.trim(),
      message: message.trim(),
      type,
      targetAudience,
      isActive: Boolean(isActive),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: (req.user?._id || req.user?.id || 'usr_super_1'),
      createdByName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
    });

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'BROADCAST_PUBLISHED',
      details: {
        title,
        type,
        targetAudience,
        isActive,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Global system announcement broadcasted successfully.',
      broadcast,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (global.useMemoryStore) {
      const idx = (memoryStore.broadcasts || []).findIndex((b) => b._id === id);
      if (idx !== -1) {
        memoryStore.broadcasts.splice(idx, 1);
      }

      await recordAuditLog({
        actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
        actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
        actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
        action: 'BROADCAST_DELETED',
        details: { broadcastId: id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({ success: true, message: 'Broadcast deleted successfully.' });
    }

    await Broadcast.findByIdAndDelete(id);

    await recordAuditLog({
      actorId: (req.user?._id || req.user?.id || 'usr_super_1'),
      actorName: (req.user?.name || 'Naveed (Super Admin)') || 'Naveed (Super Admin)',
      actorEmail: (req.user?.email || 'naveed@naveedpos.com') || 'naveed@naveedpos.com',
      action: 'BROADCAST_DELETED',
      details: { broadcastId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, message: 'Broadcast deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// Public/Merchant route to fetch active broadcast with targetAudience filtering
const getActiveBroadcast = async (req, res, next) => {
  try {
    const now = new Date();
    const audienceFilter = (req.query.audience || req.query.status || 'ALL').toUpperCase();

    if (global.useMemoryStore) {
      const activeList = (memoryStore.broadcasts || []).filter(
        (b) => b.isActive && (!b.expiresAt || new Date(b.expiresAt) > now)
      );

      let active = null;
      if (audienceFilter === 'TRIAL' || audienceFilter === 'TRIAL_ONLY') {
        active =
          activeList.find((b) => b.targetAudience === 'TRIAL_ONLY') ||
          activeList.find((b) => b.targetAudience === 'ALL' || !b.targetAudience);
      } else if (audienceFilter === 'EXPIRED' || audienceFilter === 'EXPIRED_ONLY') {
        active =
          activeList.find((b) => b.targetAudience === 'EXPIRED_ONLY') ||
          activeList.find((b) => b.targetAudience === 'ALL' || !b.targetAudience);
      } else {
        active = activeList.find((b) => b.targetAudience === 'ALL' || !b.targetAudience);
      }

      return res.status(200).json({ success: true, broadcast: active || null });
    }

    const audienceCondition = [
      { targetAudience: 'ALL' },
      { targetAudience: null },
      { targetAudience: { $exists: false } },
    ];
    if (audienceFilter === 'TRIAL' || audienceFilter === 'TRIAL_ONLY') {
      audienceCondition.push({ targetAudience: 'TRIAL_ONLY' });
    } else if (audienceFilter === 'EXPIRED' || audienceFilter === 'EXPIRED_ONLY') {
      audienceCondition.push({ targetAudience: 'EXPIRED_ONLY' });
    }

    const active = await Broadcast.findOne({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      $and: [{ $or: audienceCondition }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, broadcast: active || null });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// MODULE E: PLATFORM SECURITY & MASTER AUDIT LOGS
// =========================================================================
const getAuditLogs = async (req, res, next) => {
  try {
    const { action = 'all', search = '', limit = 50, page = 1 } = req.query;
    const numLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const numPage = Math.max(1, Number(page) || 1);

    if (global.useMemoryStore) {
      let list = [...(memoryStore.auditLogs || [])];
      if (action && action !== 'all') {
        list = list.filter((l) => l.action === action);
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (l) =>
            (l.actorName && l.actorName.toLowerCase().includes(q)) ||
            (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
            (l.targetTenantName && l.targetTenantName.toLowerCase().includes(q)) ||
            (l.action && l.action.toLowerCase().includes(q)) ||
            (l.details && JSON.stringify(l.details).toLowerCase().includes(q))
        );
      }
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const total = list.length;
      const paginated = list.slice((numPage - 1) * numLimit, numPage * numLimit);

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total,
        page: numPage,
        pages: Math.ceil(total / numLimit) || 1,
        auditLogs: paginated,
      });
    }

    const query = {};
    if (action && action !== 'all') {
      query.action = action;
    }
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { actorName: new RegExp(q, 'i') },
        { actorEmail: new RegExp(q, 'i') },
        { targetTenantName: new RegExp(q, 'i') },
        { action: new RegExp(q, 'i') },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((numPage - 1) * numLimit)
      .limit(numLimit);

    res.status(200).json({
      success: true,
      count: auditLogs.length,
      total,
      page: numPage,
      pages: Math.ceil(total / numLimit) || 1,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordAuditLog,
  getGlobalMetrics,
  getTenantsDirectory,
  createTenant,
  deleteTenant,
  updateTenantPlanAndLimits,
  quickExtendSubscription,
  toggleStoreSuspension,
  impersonateStore,
  purgeTenantData,
  getPaymentQueue,
  approvePayment,
  rejectPayment,
  reviewPayment,
  getBroadcasts,
  createOrUpdateBroadcast,
  deleteBroadcast,
  getActiveBroadcast,
  getAuditLogs,
};
