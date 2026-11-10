const Tenant = require('../models/Tenant');
const memoryStore = require('../config/memoryStore');

const tenantGuard = async (req, res, next) => {
  try {
    // Super Admin has unrestricted global access across all tenants
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        code: 'NO_TENANT',
        message: 'Access Denied: No store tenant is associated with this user account.',
      });
    }

    let tenant;
    if (global.useMemoryStore) {
      tenant = memoryStore.tenants.find((t) => t._id === tenantId.toString());
    } else {
      tenant = await Tenant.findById(tenantId);
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        code: 'TENANT_NOT_FOUND',
        message: 'Store tenant record not found.',
      });
    }

    // Check store suspension
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        success: false,
        code: 'STORE_SUSPENDED',
        isSuspended: true,
        message: 'Access Suspended: This retail store has been suspended by the platform administrator (Naveed).',
      });
    }

    // Check subscription / trial expiry
    const isExpired = tenant.subscriptionExpiresAt && new Date(tenant.subscriptionExpiresAt) <= new Date();
    if (isExpired || tenant.status === 'expired') {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        isExpired: true,
        message: 'Subscription expired. Please renew your plan.',
      });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = tenantGuard;