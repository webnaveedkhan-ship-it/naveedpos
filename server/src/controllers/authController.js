const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const memoryStore = require('../config/memoryStore');
const { getPlanLimits } = require('../config/plans');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'naveedpos_super_secret_jwt_key_2026_production',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

const sendTokenResponse = async (user, statusCode, res, extra = {}) => {
  const token = generateToken(user._id);

  let tenantName = 'Super Admin Control';
  let tenantData = null;
  if (user.tenantId) {
    if (global.useMemoryStore) {
      const t = memoryStore.tenants.find((item) => item._id === user.tenantId);
      tenantName = t ? t.name : 'Retail Store';
      tenantData = t
        ? {
            name: t.name,
            status: t.status,
            plan: t.plan || 'trial',
            planLimits: t.planLimits || getPlanLimits(t.plan),
            taxRate: t.settings?.taxRate ?? 0,
            subscriptionExpiresAt: t.subscriptionExpiresAt,
          }
        : null;
    } else {
      const t = await Tenant.findById(user.tenantId);
      tenantName = t ? t.name : 'Retail Store';
      tenantData = t
        ? {
            name: t.name,
            status: t.status,
            plan: t.plan || 'trial',
            planLimits: t.planLimits || getPlanLimits(t.plan),
            taxRate: t.settings?.taxRate ?? 0,
            subscriptionExpiresAt: t.subscriptionExpiresAt,
          }
        : null;
    }
  }

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || null,
        tenantName,
        tenantPlan: tenantData?.plan || 'trial',
        planLimits: tenantData?.planLimits || (user.role === 'SUPER_ADMIN' ? getPlanLimits('premium') : getPlanLimits('trial')),
        status: user.status || (user.isActive ? 'active' : 'inactive'),
        phone: user.phone || '',
      },
      tenant: tenantData,
      ...extra,
    });
};

const normalizePhoneDigits = (raw) => {
  if (!raw) return '';
  let digits = raw.toString().replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '92' + digits.substring(1);
  } else if (digits.length === 10 && digits.startsWith('3')) {
    digits = '92' + digits;
  } else if (digits.startsWith('0092')) {
    digits = digits.substring(2);
  }
  return digits;
};

const login = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.email || req.body.identifier || req.body.phone || '').trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/phone and password',
      });
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();
    const normalizedInputPhone = normalizePhoneDigits(rawIdentifier);

    // Common username aliases for frictionless convenience
    const usernameAliases = {
      admin: 'admin@naveedpos.com',
      superadmin: 'naveed@naveedpos.com',
      naveed: 'naveed@naveedpos.com',
      tahir: 'admin@naveedpos.com',
      khan: 'khan@naveedpos.com',
      trial: 'trial@naveedpos.com',
    };
    const resolvedEmail = usernameAliases[cleanIdentifier] || cleanIdentifier;

    let user;
    if (global.useMemoryStore) {
      user = memoryStore.users.find((u) => {
        const uEmail = (u.email || '').toLowerCase();
        if (uEmail === cleanIdentifier || uEmail === resolvedEmail) return true;

        if (u.phone) {
          const uNorm = normalizePhoneDigits(u.phone);
          if (normalizedInputPhone && uNorm === normalizedInputPhone) return true;
          if (u.phone.replace(/[\s-]/g, '') === rawIdentifier.replace(/[\s-]/g, '')) return true;
        }
        return false;
      });
    } else {
      const orClauses = [
        { email: cleanIdentifier },
        { email: resolvedEmail },
        { phone: rawIdentifier },
        { phone: rawIdentifier.replace(/[\s-]/g, '') },
      ];
      if (normalizedInputPhone) {
        orClauses.push({ phone: normalizedInputPhone });
        orClauses.push({ phone: `+${normalizedInputPhone}` });
        if (normalizedInputPhone.startsWith('92')) {
          orClauses.push({ phone: `0${normalizedInputPhone.slice(2)}` });
        }
      }
      user = await User.findOne({ $or: orClauses }).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found for this email/mobile number. Default demo: admin@naveedpos.com',
      });
    }

    if (user.status === 'inactive' || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.',
      });
    }

    let isMatch = await user.matchPassword(password);
    if (!isMatch && typeof password === 'string' && password.trim() !== password) {
      isMatch = await user.matchPassword(password.trim());
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. (Default demo password is: admin123)',
      });
    }

    // Verify Tenant Status for Store Users
    if (user.role === 'STORE_ADMIN' && user.tenantId) {
      let tenant;
      if (global.useMemoryStore) {
        tenant = memoryStore.tenants.find((t) => t._id === user.tenantId);
      } else {
        tenant = await Tenant.findById(user.tenantId);
      }

      if (tenant) {
        if (tenant.status === 'suspended') {
          return res.status(403).json({
            success: false,
            code: 'SUBSCRIPTION_LOCKED',
            message: 'Access Suspended: This retail store has been suspended by the platform administrator (Naveed).',
          });
        }
        if (tenant.status === 'expired' || (tenant.subscriptionExpiresAt && new Date(tenant.subscriptionExpiresAt) < new Date() && tenant.status !== 'trial')) {
          return res.status(403).json({
            success: false,
            code: 'SUBSCRIPTION_LOCKED',
            message: 'Your subscription or trial has expired. Contact NaveedPOS to reactivate.',
          });
        }
      }
    }

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Identify store by email or slug for dynamic branding
// @route   POST /api/auth/identify-store
// @access  Public
const identifyStore = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(200).json({ success: true, identified: false });
    }

    const clean = identifier.trim().toLowerCase();
    let tenant = null;

    if (global.useMemoryStore) {
      // Find user by email
      const user = memoryStore.users.find((u) => u.email.toLowerCase() === clean);
      if (user && user.tenantId) {
        tenant = memoryStore.tenants.find((t) => t._id === user.tenantId);
      }
      // Or find directly by tenant slug or ownerEmail
      if (!tenant) {
        tenant = memoryStore.tenants.find(
          (t) => t.slug === clean || t.ownerEmail?.toLowerCase() === clean
        );
      }
    } else {
      const user = await User.findOne({ email: clean });
      if (user && user.tenantId) {
        tenant = await Tenant.findById(user.tenantId);
      }
      if (!tenant) {
        tenant = await Tenant.findOne({
          $or: [{ slug: clean }, { ownerEmail: clean }],
        });
      }
    }

    if (tenant) {
      return res.status(200).json({
        success: true,
        identified: true,
        storeName: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
        isSubscribed: tenant.status === 'active' || tenant.status === 'trial',
      });
    }

    return res.status(200).json({
      success: true,
      identified: false,
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'CASHIER', phone, tenantId } = req.body;

    if (global.useMemoryStore) {
      const exists = memoryStore.users.find((u) => u.email === email.toLowerCase());
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email address already exists',
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: `usr_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        tenantId: tenantId || null,
        role: role.toUpperCase(),
        phone: phone || '',
        status: 'active',
        isActive: true,
        matchPassword: async function (p) {
          return bcrypt.compare(p, this.password);
        },
      };
      memoryStore.users.push(newUser);
      return sendTokenResponse(newUser, 201, res);
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      tenantId: tenantId || null,
      role: role.toUpperCase(),
      phone: phone || '',
      status: 'active',
    });

    await sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    let tenantName = 'Super Admin Control';
    let tenantStatus = 'active';
    let tenantPlan = req.user.role === 'SUPER_ADMIN' ? 'premium' : 'trial';
    let planLimits = getPlanLimits(tenantPlan);
    let subscriptionExpiresAt = null;

    if (req.user.tenantId) {
      if (global.useMemoryStore) {
        const t = memoryStore.tenants.find((item) => item._id === req.user.tenantId);
        if (t) {
          tenantName = t.name;
          tenantStatus = t.status;
          tenantPlan = t.plan || 'monthly';
          planLimits = t.planLimits || getPlanLimits(t.plan);
          subscriptionExpiresAt = t.subscriptionExpiresAt;
        }
      } else {
        const t = await Tenant.findById(req.user.tenantId);
        if (t) {
          tenantName = t.name;
          tenantStatus = t.status;
          tenantPlan = t.plan || 'monthly';
          planLimits = t.planLimits || getPlanLimits(t.plan);
          subscriptionExpiresAt = t.subscriptionExpiresAt;
        }
      }
    }

    const daysRemaining = subscriptionExpiresAt
      ? Math.max(0, Math.ceil((new Date(subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        tenantId: req.user.tenantId || null,
        tenantName,
        tenantStatus,
        tenantPlan,
        planLimits,
        subscriptionExpiresAt,
        daysRemaining,
        status: req.user.status,
        phone: req.user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public self-service sign up for new store with instant 14-day trial
// @route   POST /api/auth/register-trial
// @access  Public
const registerStoreAndTrial = async (req, res, next) => {
  try {
    const shopName = req.body.shopName || req.body.storeName;
    const { ownerName, email, phone, city = 'Islamabad', password } = req.body;

    if (!shopName || !ownerName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide shop name, owner name, email, and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = (phone || '').trim();
    const cleanShopName = shopName.trim();
    const slugBase = cleanShopName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${slugBase || 'store'}-${Date.now().toString().slice(-4)}`;

    const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day trial window

    if (global.useMemoryStore) {
      const emailExists = memoryStore.users.some((u) => u.email === cleanEmail);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
      }

      const tenantId = `tenant_${Date.now()}`;
      const newTenant = {
        _id: tenantId,
        name: cleanShopName,
        slug,
        ownerEmail: cleanEmail,
        phone: cleanPhone,
        city: city.trim(),
        status: 'trial',
        plan: 'trial',
        subscriptionExpiresAt: trialExpiry,
        maxUsers: 5,
        maxProducts: 1000,
        settings: {
          currency: 'PKR',
          currencySymbol: 'Rs.',
          taxRate: 0,
          receiptHeader: cleanShopName,
          receiptFooter: 'Thank you for shopping with us!',
          address: `${city.trim()}, Pakistan`,
          phone: cleanPhone,
        },
        createdAt: new Date(),
      };
      memoryStore.tenants.unshift(newTenant);

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: `usr_${Date.now()}`,
        name: ownerName.trim(),
        email: cleanEmail,
        password: hashedPassword,
        tenantId,
        role: 'STORE_ADMIN',
        phone: cleanPhone,
        status: 'active',
        isActive: true,
        createdAt: new Date(),
        matchPassword: async function (p) {
          return bcrypt.compare(p, this.password);
        },
      };
      memoryStore.users.push(newUser);

      // Pre-seed starter retail products for this tenant
      const defaultProducts = [
        { title: 'Super Basmati Rice 5kg', sku: 'RICE-001', category: 'Grocery', price: 1850, costPrice: 1600, stockQuantity: 30, lowStockAlert: 5 },
        { title: 'Dalda Cooking Oil 1L Pouch', sku: 'OIL-002', category: 'Grocery', price: 540, costPrice: 490, stockQuantity: 45, lowStockAlert: 8 },
        { title: 'Tapal Danedar Tea 430g', sku: 'TEA-003', category: 'Beverages', price: 680, costPrice: 590, stockQuantity: 25, lowStockAlert: 5 },
        { title: 'Olpers Milk 1 Litre', sku: 'MILK-004', category: 'Dairy', price: 290, costPrice: 260, stockQuantity: 50, lowStockAlert: 10 },
      ];
      defaultProducts.forEach((p, idx) => {
        memoryStore.products.push({
          _id: `prod_${Date.now()}_${idx}`,
          tenantId,
          title: p.title,
          sku: p.sku,
          category: p.category,
          price: p.price,
          costPrice: p.costPrice,
          stockQuantity: p.stockQuantity,
          lowStockAlert: p.lowStockAlert,
          image: '',
          description: '',
          status: 'active',
          createdAt: new Date(),
        });
      });

      return sendTokenResponse(newUser, 201, res, { tenant: newTenant });
    }

    // MONGODB PATH
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const tenant = await Tenant.create({
      name: cleanShopName,
      slug,
      ownerEmail: cleanEmail,
      phone: cleanPhone,
      city: city.trim(),
      status: 'trial',
      plan: 'trial',
      subscriptionExpiresAt: trialExpiry,
      settings: {
        currency: 'PKR',
        currencySymbol: 'Rs.',
        taxRate: 0,
        receiptHeader: cleanShopName,
        receiptFooter: 'Thank you for shopping with us!',
        address: `${city.trim()}, Pakistan`,
        phone: cleanPhone,
      },
    });

    const user = await User.create({
      name: ownerName.trim(),
      email: cleanEmail,
      password,
      tenantId: tenant._id,
      role: 'STORE_ADMIN',
      phone: cleanPhone,
      status: 'active',
      isActive: true,
    });

    // Seed starter products
    const Product = require('../models/Product');
    await Product.insertMany([
      { tenantId: tenant._id, title: 'Super Basmati Rice 5kg', sku: 'RICE-001', category: 'Grocery', sellingPrice: 1850, costPrice: 1600, stockQuantity: 30, lowStockThreshold: 5 },
      { tenantId: tenant._id, title: 'Dalda Cooking Oil 1L Pouch', sku: 'OIL-002', category: 'Grocery', sellingPrice: 540, costPrice: 490, stockQuantity: 45, lowStockThreshold: 8 },
      { tenantId: tenant._id, title: 'Tapal Danedar Tea 430g', sku: 'TEA-003', category: 'Beverages', sellingPrice: 680, costPrice: 590, stockQuantity: 25, lowStockThreshold: 5 },
      { tenantId: tenant._id, title: 'Olpers Milk 1 Litre', sku: 'MILK-004', category: 'Dairy', sellingPrice: 290, costPrice: 260, stockQuantity: 50, lowStockThreshold: 10 },
    ]);

    await sendTokenResponse(user, 201, res, { tenant });
  } catch (error) {
    next(error);
  }
};

// @desc    Super Admin impersonates a retail store for technical support
// @route   POST /api/auth/impersonate/:tenantId
// @access  Private (Super Admin Only)
const impersonateTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can impersonate store accounts.' });
    }

    let tenant;
    let storeAdminUser;

    if (global.useMemoryStore) {
      tenant = memoryStore.tenants.find((t) => t._id === tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found.' });
      }
      storeAdminUser = memoryStore.users.find(
        (u) => u.tenantId === tenantId && (u.role === 'STORE_ADMIN' || u.role === 'ADMIN')
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
      tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Store tenant not found.' });
      }
      storeAdminUser = await User.findOne({ tenantId, role: 'STORE_ADMIN' });
      if (!storeAdminUser) {
        storeAdminUser = await User.findOne({ tenantId });
      }
    }

    if (!storeAdminUser) {
      return res.status(404).json({ success: false, message: 'No admin user found for this store tenant.' });
    }

    const token = generateToken(storeAdminUser._id);

    res.status(200).json({
      success: true,
      message: `Impersonating ${tenant.name}`,
      token,
      user: {
        id: storeAdminUser._id,
        name: storeAdminUser.name,
        email: storeAdminUser.email,
        role: storeAdminUser.role,
        tenantId: tenant._id,
        tenantName: tenant.name,
        isImpersonated: true,
        impersonatedBy: req.user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: 'User successfully logged out',
  });
};

module.exports = {
  login,
  register,
  registerStoreAndTrial,
  impersonateTenant,
  identifyStore,
  getMe,
  logout,
};
