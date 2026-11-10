const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const {
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
  getAuditLogs,
} = require('../controllers/superAdminController');

// Strict Access Boundary: Reject unauthenticated or normal STORE_ADMIN users with 401/403
router.use(protect);
router.use(superAdminOnly);

// Module A: Global SaaS Metrics & Financial Health
router.get('/metrics', getGlobalMetrics);
router.get('/stats', getGlobalMetrics); // Alias

// Module B: Tenant Management Directory & Actions
router.get('/tenants', getTenantsDirectory);
router.post('/tenants', createTenant);
router.delete('/tenants/:id', deleteTenant);
router.put('/tenants/:id/plan', updateTenantPlanAndLimits);
router.patch('/tenants/:id/subscription', updateTenantPlanAndLimits); // Alias
router.put('/tenants/:id/extend', quickExtendSubscription);
router.put('/tenants/:id/status', toggleStoreSuspension);
router.patch('/tenants/:id/status', toggleStoreSuspension); // Alias
router.post('/tenants/:id/impersonate', impersonateStore);
router.post('/tenants/:id/purge-data', purgeTenantData); // Hard Reset / Data Purge

// Module C: Manual Subscription Payment Approval Queue
router.get('/payments', getPaymentQueue);
router.put('/payments/:id/approve', approvePayment);
router.put('/payments/:id/reject', rejectPayment);
router.patch('/payments/:id/review', reviewPayment); // Unified review

// Module D: Global System Broadcast Notifications
router.get('/broadcast', getBroadcasts);
router.post('/broadcast', createOrUpdateBroadcast);
router.delete('/broadcast/:id', deleteBroadcast);

// Module E: Platform Security & Master Audit Logs
router.get('/audit', getAuditLogs);

module.exports = router;
