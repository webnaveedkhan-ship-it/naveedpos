const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomerKhata = require('../models/CustomerKhata');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const bcrypt = require('bcryptjs');
const memoryStore = require('../config/memoryStore');
const { SUBSCRIPTION_PLANS, getPlanLimits } = require('../config/plans');
const { uploadToCloud } = require('../services/cloudStorageService');

// @desc    Get all tenants with subscriber metrics (Super Admin only)
// @route   GET /api/tenants
// @access  Private (SUPER_ADMIN)
const getTenants = async (req, res, next) => {
  try {
    if (global.useMemoryStore) {
      const tenantsWithStats = memoryStore.tenants.map((t) => {
        const usersCount = memoryStore.users.filter((u) => u.tenantId === t._id).length;
        const productsCount = memoryStore.products.filter((p) => p.tenantId === t._id).length;
        const ordersCount = memoryStore.orders.filter((o) => o.tenantId === t._id).length;
        const khatasCount = (memoryStore.khatas || []).filter((k) => k.tenantId === t._id).length;
        const daysRemaining = t.subscriptionExpiresAt
          ? Math.max(0, Math.ceil((new Date(t.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          ...t,
          planLimits: t.planLimits || getPlanLimits(t.plan),
          usersCount,
          productsCount,
          ordersCount,
          khatasCount,
          daysRemaining,
        };
      });

      return res.status(200).json({
        success: true,
        count: tenantsWithStats.length,
        tenants: tenantsWithStats,
      });
    }

    const tenants = await Tenant.find().sort({ createdAt: -1 });

    const tenantsWithStats = await Promise.all(
      tenants.map(async (t) => {
        const usersCount = await User.countDocuments({ tenantId: t._id });
        const productsCount = await Product.countDocuments({ tenantId: t._id });
        const ordersCount = await Order.countDocuments({ tenantId: t._id });
        const khatasCount = await CustomerKhata.countDocuments({ tenantId: t._id });
        const tenantObj = t.toObject();
        const daysRemaining = t.subscriptionExpiresAt
          ? Math.max(0, Math.ceil((new Date(t.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          ...tenantObj,
          planLimits: t.planLimits || getPlanLimits(t.plan),
          usersCount,
          productsCount,
          ordersCount,
          khatasCount,
          daysRemaining,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tenantsWithStats.length,
      tenants: tenantsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new tenant store with Owner admin account (Super Admin Manual Provisioning)
// @route   POST /api/tenants
// @access  Private (SUPER_ADMIN)
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
      address,
      subscriptionMonths = 12,
    } = req.body;

    if (!name || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        success: false,
        message: 'Store name, owner email, and owner password are required',
      });
    }

    const sanitizedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + Number(subscriptionMonths));

    if (global.useMemoryStore) {
      const slugExists = memoryStore.tenants.find((t) => t.slug === sanitizedSlug);
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: `A store with slug "${sanitizedSlug}" already exists.`,
        });
      }

      const tenantId = `tenant_${Date.now()}`;
      const newTenant = {
        _id: tenantId,
        name,
        slug: sanitizedSlug,
        ownerEmail: ownerEmail.toLowerCase(),
        phone: phone || '',
        city,
        status: 'active',
        plan: Number(subscriptionMonths) >= 12 ? 'yearly' : 'monthly',
        subscriptionExpiresAt: expiryDate,
        maxUsers: 5,
        maxProducts: 1000,
        settings: {
          currency: 'PKR',
          currencySymbol: 'Rs.',
          taxRate: 5,
          receiptHeader: name,
          address: address || `${city}, Pakistan`,
          receiptFooter: 'Thank You For Your Business!',
          phone: phone || '',
        },
        createdAt: new Date(),
      };

      memoryStore.tenants.unshift(newTenant);

      const hashedPassword = await bcrypt.hash(ownerPassword, 10);
      const newAdmin = {
        _id: `usr_${Date.now()}`,
        name: ownerName || `${name} Owner`,
        email: ownerEmail.toLowerCase(),
        password: hashedPassword,
        tenantId,
        role: 'STORE_ADMIN',
        phone: phone || '',
        status: 'active',
        isActive: true,
        createdAt: new Date(),
        matchPassword: async function (p) {
          return bcrypt.compare(p, this.password);
        },
      };

      memoryStore.users.push(newAdmin);

      return res.status(201).json({
        success: true,
        message: `Store "${name}" created successfully with Store Admin credentials.`,
        tenant: newTenant,
      });
    }

    // MONGODB PATH
    const slugExists = await Tenant.findOne({ slug: sanitizedSlug });
    if (slugExists) {
      return res.status(400).json({
        success: false,
        message: `A store with slug "${sanitizedSlug}" already exists.`,
      });
    }

    const tenant = await Tenant.create({
      name,
      slug: sanitizedSlug,
      ownerEmail: ownerEmail.toLowerCase(),
      phone: phone || '',
      city,
      status: 'active',
      plan: Number(subscriptionMonths) >= 12 ? 'yearly' : 'monthly',
      subscriptionExpiresAt: expiryDate,
      settings: {
        currency: 'PKR',
        currencySymbol: 'Rs.',
        taxRate: 5,
        receiptHeader: name,
        address: address || `${city}, Pakistan`,
        receiptFooter: 'Thank You For Your Business!',
        phone: phone || '',
      },
    });

    await User.create({
      name: ownerName || `${name} Owner`,
      email: ownerEmail.toLowerCase(),
      password: ownerPassword,
      tenantId: tenant._id,
      role: 'STORE_ADMIN',
      phone: phone || '',
    });

    res.status(201).json({
      success: true,
      message: `Store "${name}" created successfully with Store Admin credentials.`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle tenant status (Activate / Suspend)
// @route   PUT /api/tenants/:id/status
// @access  Private (SUPER_ADMIN)
const toggleTenantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'trial', 'expired'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (global.useMemoryStore) {
      const tenant = memoryStore.tenants.find((t) => t._id === req.params.id);
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
      tenant.status = status;
      return res.status(200).json({
        success: true,
        message: `Store status changed to "${status}"`,
        tenant,
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.status(200).json({
      success: true,
      message: `Store status changed to "${status}"`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extend subscription validity
// @route   PUT /api/tenants/:id/subscription
// @access  Private (SUPER_ADMIN)
const extendSubscription = async (req, res, next) => {
  try {
    const { days = 30 } = req.body;

    if (global.useMemoryStore) {
      const tenant = memoryStore.tenants.find((t) => t._id === req.params.id);
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

      const currentExpiry = new Date(tenant.subscriptionExpiresAt) > new Date()
        ? new Date(tenant.subscriptionExpiresAt)
        : new Date();
      currentExpiry.setDate(currentExpiry.getDate() + Number(days));
      tenant.subscriptionExpiresAt = currentExpiry;
      tenant.status = 'active';

      return res.status(200).json({
        success: true,
        message: `Subscription extended by ${days} days until ${currentExpiry.toLocaleDateString()}`,
        tenant,
      });
    }

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const currentExpiry = new Date(tenant.subscriptionExpiresAt) > new Date()
      ? new Date(tenant.subscriptionExpiresAt)
      : new Date();
    currentExpiry.setDate(currentExpiry.getDate() + Number(days));
    tenant.subscriptionExpiresAt = currentExpiry;
    tenant.status = 'active';
    await tenant.save();

    res.status(200).json({
      success: true,
      message: `Subscription extended by ${days} days until ${currentExpiry.toLocaleDateString()}`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Super Admin switches a tenant's subscription plan & updates limits
// @route   PUT /api/tenants/:id/plan
// @access  Private (SUPER_ADMIN)
const updateTenantPlan = async (req, res, next) => {
  try {
    const { plan, extendDays } = req.body;
    const normalizedPlan = (plan || '').toLowerCase();
    if (!['trial', 'basic', 'standard', 'premium'].includes(normalizedPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan specified' });
    }

    const limits = getPlanLimits(normalizedPlan);

    if (global.useMemoryStore) {
      const tenant = memoryStore.tenants.find((t) => t._id === req.params.id);
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant store not found' });

      tenant.plan = normalizedPlan;
      tenant.planLimits = limits;
      tenant.status = 'active';

      if (extendDays && Number(extendDays) > 0) {
        const currentExpiry = new Date(tenant.subscriptionExpiresAt) > new Date()
          ? new Date(tenant.subscriptionExpiresAt)
          : new Date();
        currentExpiry.setDate(currentExpiry.getDate() + Number(extendDays));
        tenant.subscriptionExpiresAt = currentExpiry;
      }

      return res.status(200).json({
        success: true,
        message: `Store plan updated to ${SUBSCRIPTION_PLANS[normalizedPlan]?.name || normalizedPlan}. Limits synchronized.`,
        tenant,
      });
    }

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant store not found' });

    tenant.plan = normalizedPlan;
    tenant.planLimits = limits;
    tenant.status = 'active';

    if (extendDays && Number(extendDays) > 0) {
      const currentExpiry = new Date(tenant.subscriptionExpiresAt) > new Date()
        ? new Date(tenant.subscriptionExpiresAt)
        : new Date();
      currentExpiry.setDate(currentExpiry.getDate() + Number(extendDays));
      tenant.subscriptionExpiresAt = currentExpiry;
    }

    await tenant.save();

    res.status(200).json({
      success: true,
      message: `Store plan updated to ${SUBSCRIPTION_PLANS[normalizedPlan]?.name || normalizedPlan}. Limits synchronized.`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a tenant store and associated records
// @route   DELETE /api/tenants/:id
// @access  Private (SUPER_ADMIN)
const deleteTenant = async (req, res, next) => {
  try {
    const tenantId = req.params.id;

    if (global.useMemoryStore) {
      const idx = memoryStore.tenants.findIndex((t) => t._id === tenantId);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }
      memoryStore.tenants.splice(idx, 1);
      memoryStore.users = memoryStore.users.filter((u) => u.tenantId !== tenantId);
      memoryStore.products = memoryStore.products.filter((p) => p.tenantId !== tenantId);
      memoryStore.orders = memoryStore.orders.filter((o) => o.tenantId !== tenantId);
      memoryStore.khatas = memoryStore.khatas.filter((k) => k.tenantId !== tenantId);
      memoryStore.subscriptionPayments = memoryStore.subscriptionPayments.filter((p) => p.tenantId !== tenantId);

      return res.status(200).json({
        success: true,
        message: 'Store tenant and all associated records deleted permanently.',
      });
    }

    await Promise.all([
      Tenant.findByIdAndDelete(tenantId),
      User.deleteMany({ tenantId }),
      Product.deleteMany({ tenantId }),
      Order.deleteMany({ tenantId }),
      CustomerKhata.deleteMany({ tenantId }),
      SubscriptionPayment.deleteMany({ tenantId }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Store tenant and all associated records deleted permanently.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Platform SaaS Global Overview Metrics
// @route   GET /api/tenants/metrics/platform
// @access  Private (SUPER_ADMIN)
const getPlatformStats = async (req, res, next) => {
  try {
    if (global.useMemoryStore) {
      const totalTenants = memoryStore.tenants.length;
      const activeTenants = memoryStore.tenants.filter((t) => t.status === 'active').length;
      const trialTenants = memoryStore.tenants.filter((t) => t.status === 'trial').length;
      const suspendedTenants = memoryStore.tenants.filter((t) => t.status === 'suspended').length;
      const expiredTenants = memoryStore.tenants.filter(
        (t) => t.status === 'expired' || (t.subscriptionExpiresAt && new Date(t.subscriptionExpiresAt) < new Date())
      ).length;

      const totalOrders = memoryStore.orders.length;
      const totalRevenue = memoryStore.orders.reduce((sum, o) => sum + o.grandTotal, 0);

      // Pending payments count
      const pendingPaymentsCount = memoryStore.subscriptionPayments.filter((p) => p.status === 'pending').length;

      // Calculate MRR from active tenants
      const monthlyPaying = memoryStore.tenants.filter((t) => t.status === 'active' && t.plan === 'monthly').length;
      const yearlyPaying = memoryStore.tenants.filter((t) => t.status === 'active' && t.plan === 'yearly').length;
      const mrr = monthlyPaying * 2500 + Math.round((yearlyPaying * 25000) / 12);

      return res.status(200).json({
        success: true,
        stats: {
          totalTenants,
          activeTenants,
          trialTenants,
          suspendedTenants,
          expiredTenants,
          pendingPaymentsCount,
          mrr,
          totalOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        },
      });
    }

    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const trialTenants = await Tenant.countDocuments({ status: 'trial' });
    const suspendedTenants = await Tenant.countDocuments({ status: 'suspended' });
    const expiredTenants = await Tenant.countDocuments({
      $or: [{ status: 'expired' }, { subscriptionExpiresAt: { $lt: new Date() } }],
    });

    const pendingPaymentsCount = await SubscriptionPayment.countDocuments({ status: 'pending' });

    const monthlyPaying = await Tenant.countDocuments({ status: 'active', plan: 'monthly' });
    const yearlyPaying = await Tenant.countDocuments({ status: 'active', plan: 'yearly' });
    const mrr = monthlyPaying * 2500 + Math.round((yearlyPaying * 25000) / 12);

    const totalOrders = await Order.countDocuments();
    const allOrders = await Order.find({}, 'grandTotal');
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalTenants,
        activeTenants,
        trialTenants,
        suspendedTenants,
        expiredTenants,
        pendingPaymentsCount,
        mrr,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Store Admin gets their own subscription and billing info
// @route   GET /api/tenants/billing
// @access  Private (STORE_ADMIN)
const getMyTenantBilling = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({ success: false, message: 'No store tenant associated with user.' });
    }

    let tenant;
    let payments = [];

    if (global.useMemoryStore) {
      tenant = memoryStore.tenants.find((t) => t._id === tenantId);
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

      payments = memoryStore.subscriptionPayments
        .filter((p) => p.tenantId === tenantId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      tenant = await Tenant.findById(tenantId);
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

      payments = await SubscriptionPayment.find({ tenantId }).sort({ createdAt: -1 });
    }

    const now = new Date();
    const expiry = new Date(tenant.subscriptionExpiresAt);
    const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
    const isExpired = expiry <= now || tenant.status === 'expired';

    let productsCount = 0;
    let khataCustomersCount = 0;

    if (global.useMemoryStore) {
      productsCount = (memoryStore.products || []).filter((p) => p.tenantId === tenantId).length;
      khataCustomersCount = (memoryStore.khatas || []).filter((k) => k.tenantId === tenantId).length;
    } else {
      [productsCount, khataCustomersCount] = await Promise.all([
        Product.countDocuments({ tenantId }),
        CustomerKhata.countDocuments({ tenantId }),
      ]);
    }

    const limits = tenant.planLimits || getPlanLimits(tenant.plan);

    res.status(200).json({
      success: true,
      billing: {
        storeName: tenant.name,
        slug: tenant.slug,
        ownerEmail: tenant.ownerEmail,
        status: tenant.status,
        plan: tenant.plan || 'trial',
        planLimits: limits,
        usage: {
          productsCount,
          khataCustomersCount,
        },
        availablePlans: SUBSCRIPTION_PLANS,
        subscriptionExpiresAt: tenant.subscriptionExpiresAt,
        daysRemaining,
        isExpired,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Store Admin submits proof of subscription payment (JazzCash / EasyPaisa / Bank)
// @route   POST /api/tenants/billing/payment
// @access  Private (STORE_ADMIN)
const submitSubscriptionPayment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { amount, billingCycle = 'monthly', paymentMethod = 'JAZZCASH', transactionId, receiptUrl = '' } = req.body;

    if (!amount || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and Transaction ID / Reference are required.',
      });
    }

    let finalReceiptUrl = (receiptUrl || '').trim();
    if (req.file) {
      const uploaded = await uploadToCloud(req.file.buffer, req.file.originalname, req.file.mimetype, 'receipts');
      finalReceiptUrl = uploaded.url;
    }
    if (!finalReceiptUrl) {
      finalReceiptUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop';
    }

    let tenantName = 'Retail Store';
    if (global.useMemoryStore) {
      const t = memoryStore.tenants.find((item) => item._id === tenantId);
      if (t) tenantName = t.name;

      // Check if transaction ID duplicate
      const duplicate = memoryStore.subscriptionPayments.find(
        (p) => p.transactionId.toLowerCase() === transactionId.trim().toLowerCase()
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Transaction ID "${transactionId}" has already been submitted.`,
        });
      }

      const newPayment = {
        _id: `sub_pay_${Date.now()}`,
        tenantId,
        storeName: tenantName,
        amount: Number(amount),
        billingCycle,
        paymentMethod,
        transactionId: transactionId.trim(),
        receiptUrl: finalReceiptUrl,
        status: 'pending',
        rejectionReason: '',
        submittedBy: req.user._id,
        submittedByName: req.user.name,
        reviewedBy: null,
        reviewedByName: '',
        reviewedAt: null,
        createdAt: new Date(),
      };

      memoryStore.subscriptionPayments.unshift(newPayment);

      return res.status(201).json({
        success: true,
        message: 'Payment verification submitted! Platform admin (Naveed) will review and activate your subscription.',
        payment: newPayment,
      });
    }

    // MONGODB PATH
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });

    const existingTx = await SubscriptionPayment.findOne({ transactionId: transactionId.trim() });
    if (existingTx) {
      return res.status(400).json({
        success: false,
        message: `Transaction ID "${transactionId}" has already been submitted.`,
      });
    }

    const payment = await SubscriptionPayment.create({
      tenantId,
      storeName: tenant.name,
      amount: Number(amount),
      billingCycle,
      paymentMethod,
      transactionId: transactionId.trim(),
      receiptUrl: finalReceiptUrl,
      status: 'pending',
      submittedBy: req.user._id,
      submittedByName: req.user.name,
    });

    res.status(201).json({
      success: true,
      message: 'Payment verification submitted! Platform admin (Naveed) will review and activate your subscription.',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Super Admin gets all subscription payment verifications
// @route   GET /api/tenants/payments
// @access  Private (SUPER_ADMIN)
const getSubscriptionPayments = async (req, res, next) => {
  try {
    const { status } = req.query;

    if (global.useMemoryStore) {
      let list = [...memoryStore.subscriptionPayments];
      if (status && status !== 'all') {
        list = list.filter((p) => p.status === status);
      }
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({
        success: true,
        count: list.length,
        payments: list,
      });
    }

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const payments = await SubscriptionPayment.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Super Admin approves subscription payment and advances store validity
// @route   PUT /api/tenants/payments/:id/approve
// @access  Private (SUPER_ADMIN)
const approveSubscriptionPayment = async (req, res, next) => {
  try {
    const paymentId = req.params.id;

    if (global.useMemoryStore) {
      const payment = memoryStore.subscriptionPayments.find((p) => p._id === paymentId);
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

      payment.status = 'approved';
      payment.reviewedBy = req.user._id;
      payment.reviewedByName = req.user.name;
      payment.reviewedAt = new Date();

      // Find tenant and advance expiry
      const tenant = memoryStore.tenants.find((t) => t._id === payment.tenantId);
      if (tenant) {
        tenant.status = 'active';
        tenant.plan = payment.billingCycle;

        const daysToAdd = payment.billingCycle === 'yearly' ? 365 : 30;
        const currentExpiry = new Date(tenant.subscriptionExpiresAt) > new Date()
          ? new Date(tenant.subscriptionExpiresAt)
          : new Date();
        currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);
        tenant.subscriptionExpiresAt = currentExpiry;
      }

      return res.status(200).json({
        success: true,
        message: `Payment of Rs. ${payment.amount.toLocaleString()} approved. Store subscription extended!`,
        payment,
        tenant,
      });
    }

    // MONGODB PATH
    const payment = await SubscriptionPayment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    payment.status = 'approved';
    payment.reviewedBy = req.user._id;
    payment.reviewedByName = req.user.name;
    payment.reviewedAt = new Date();
    await payment.save();

    const tenant = await Tenant.findById(payment.tenantId);
    if (tenant) {
      tenant.status = 'active';
      tenant.plan = payment.billingCycle;

      const daysToAdd = payment.billingCycle === 'yearly' ? 365 : 30;
      const currentExpiry = new Date(tenant.subscriptionExpiresAt) > new Date()
        ? new Date(tenant.subscriptionExpiresAt)
        : new Date();
      currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);
      tenant.subscriptionExpiresAt = currentExpiry;
      await tenant.save();
    }

    res.status(200).json({
      success: true,
      message: `Payment of Rs. ${payment.amount.toLocaleString()} approved. Store subscription extended!`,
      payment,
      tenant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Super Admin rejects subscription payment with reason
// @route   PUT /api/tenants/payments/:id/reject
// @access  Private (SUPER_ADMIN)
const rejectSubscriptionPayment = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    const { reason = 'Invalid transaction reference or proof mismatch' } = req.body;

    if (global.useMemoryStore) {
      const payment = memoryStore.subscriptionPayments.find((p) => p._id === paymentId);
      if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

      payment.status = 'rejected';
      payment.rejectionReason = reason;
      payment.reviewedBy = req.user._id;
      payment.reviewedByName = req.user.name;
      payment.reviewedAt = new Date();

      return res.status(200).json({
        success: true,
        message: 'Payment verification rejected.',
        payment,
      });
    }

    const payment = await SubscriptionPayment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    payment.status = 'rejected';
    payment.rejectionReason = reason;
    payment.reviewedBy = req.user._id;
    payment.reviewedByName = req.user.name;
    payment.reviewedAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment verification rejected.',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTenants,
  createTenant,
  toggleTenantStatus,
  extendSubscription,
  updateTenantPlan,
  deleteTenant,
  getPlatformStats,
  getMyTenantBilling,
  submitSubscriptionPayment,
  getSubscriptionPayments,
  approveSubscriptionPayment,
  rejectSubscriptionPayment,
};