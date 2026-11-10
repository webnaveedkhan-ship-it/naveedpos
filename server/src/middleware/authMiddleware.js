const jwt = require('jsonwebtoken');
const User = require('../models/User');
const memoryStore = require('../config/memoryStore');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'naveedpos_super_secret_jwt_key_2026_production'
    );

    let user;
    if (global.useMemoryStore) {
      user = memoryStore.users.find((u) => u._id === decoded.id);
    } else {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status === 'inactive' || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.',
      });
    }

    // Standardize role to uppercase
    user.role = (user.role || 'CASHIER').toUpperCase();
    if (user.role === 'ADMIN') user.role = 'STORE_ADMIN';

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or expired. Please log in again.',
    });
  }
};

const authorize = (...roles) => {
  const normalizedRoles = roles.map((r) => {
    let u = r.toUpperCase();
    if (u === 'ADMIN') return 'STORE_ADMIN';
    return u;
  });

  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: User authentication required.',
      });
    }

    const userRole = (req.user.role || '').toUpperCase();

    // SUPER_ADMIN has access to everything
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${userRole}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};

const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication required.',
    });
  }

  const userRole = (req.user.role || '').toUpperCase();
  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Principal Admin (Super Admin) credentials required.',
    });
  }

  next();
};

module.exports = { protect, authorize, superAdminOnly };
