const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==========================================
// STORE ADMIN ENDPOINTS (Protected)
// ==========================================
// View own store billing, days left, payments
router.get('/billing', protect, getMyTenantBilling);

// Submit payment verification proof (TID, receipt URL, or uploaded receipt slip file)
router.post('/billing/payment', protect, upload.single('file'), submitSubscriptionPayment);

// ==========================================
// SUPER ADMIN ONLY ENDPOINTS
// ==========================================
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

// Platform-wide metrics & MRR
router.get('/metrics/platform', getPlatformStats);

// Subscription payment approvals
router.get('/payments', getSubscriptionPayments);
router.put('/payments/:id/approve', approveSubscriptionPayment);
router.put('/payments/:id/reject', rejectSubscriptionPayment);

// Tenant CRUD & Lifecycle controls
router.route('/').get(getTenants).post(createTenant);
router.put('/:id/status', toggleTenantStatus);
router.put('/:id/subscription', extendSubscription);
router.put('/:id/plan', updateTenantPlan);
router.delete('/:id', deleteTenant);

module.exports = router;
