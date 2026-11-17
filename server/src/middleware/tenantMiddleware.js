const Tenant = require('../models/Tenant');
const memoryStore = require('../config/memoryStore');

/**
 * Tenant Data Isolation & Security Middleware
 * Extracts and strictly verifies req.user.tenantId from the authenticated JWT session.
 * Injects tenant context and query filters to guarantee zero cross-tenant data leaks.
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // 1. Authenticated User Check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required before tenant verification.',
      });
    }

    // 2. Super Admin Global Platform Access
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'SUPER_ADMIN') {
      // Optional header for Super Admin store impersonation or tenant inspection
      const impersonatedTenantId = req.headers['x-tenant-id'] || req.query.impersonateTenantId;
      if (impersonatedTenantId) {
        req.tenantId = impersonatedTenantId;
        req.tenantFilter = { tenantId: impersonatedTenantId };
        req.scopeTenant = (customQuery = {}) => ({ ...customQuery, tenantId: impersonatedTenantId });
      } else {
        req.tenantId = null;
        req.tenantFilter = {};
        req.scopeTenant = (customQuery = {}) => ({ ...customQuery });
      }
      return next();
    }

    // 3. Extract Tenant ID from user claims
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        code: 'NO_TENANT',
        message: 'Access Denied: No retail store tenant is associated with this user account.',
      });
    }

    // 4. Retrieve Tenant Record (Memory Store or MongoDB)
    let tenant;
    if (global.useMemoryStore) {
      tenant = (memoryStore.tenants || []).find(
        (t) => (t._id || '').toString() === tenantId.toString()
      );
    } else {
      tenant = await Tenant.findById(tenantId);
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        code: 'TENANT_NOT_FOUND',
        message: 'Store tenant record not found or has been removed.',
      });
    }

    // 5. Check Store Suspension by Platform Super Admin
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        success: false,
        code: 'STORE_SUSPENDED',
        isSuspended: true,
        message: 'Access Suspended: This retail store has been suspended by the platform administrator.',
      });
    }

    // 6. Check Subscription / 14-Day Trial Expiry
    const isExpired =
      tenant.subscriptionExpiresAt &&
      new Date(tenant.subscriptionExpiresAt).getTime() <= Date.now();
    if (isExpired || tenant.status === 'expired') {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        isExpired: true,
        message: 'Subscription or 14-day trial has expired. Please renew your store plan to continue billing.',
      });
    }

    // 7. Secure Context Injection
    const normalizedTenantId = tenantId.toString();
    req.tenant = tenant;
    req.tenantId = normalizedTenantId;
    req.tenantFilter = { tenantId };
    req.scopeTenant = (customQuery = {}) => ({ ...customQuery, tenantId });

    // 8. Prevent Cross-Tenant Injection in Payload
    if (req.body && typeof req.body === 'object') {
      req.body.tenantId = tenantId;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Utility helper to enforce tenant isolation filter on Mongoose queries
 */
const scopeQueryToTenant = (req, query = {}) => {
  if (req.user?.role === 'SUPER_ADMIN' && !req.tenantId) {
    return query;
  }
  return { ...query, tenantId: req.user.tenantId };
};

module.exports = {
  tenantMiddleware,
  tenantGuard: tenantMiddleware, // Backwards-compatible alias
  scopeQueryToTenant,
};
