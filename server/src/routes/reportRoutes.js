const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getDashboardMetrics,
  getDetailedSalesReport,
  getVisualAnalytics,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantGuard');

router.use(protect);
router.use(tenantGuard);
router.use(authorize('STORE_ADMIN'));

// GET /api/reports/visual-analytics (Interactive Sales & Profit Visual Reports)
router.get('/visual-analytics', getVisualAnalytics);

// GET /api/reports/detailed-sales (Enterprise Sales & Net Profit Reports)
router.get('/detailed-sales', getDetailedSalesReport);

// GET /api/reports/dashboard-metrics
router.get('/dashboard-metrics', getDashboardMetrics);

// GET /api/reports/sales
router.get('/sales', getSalesReport);

module.exports = router;
