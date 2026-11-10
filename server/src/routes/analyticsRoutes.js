const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantGuard');

router.use(protect);
router.use(tenantGuard);
router.use(authorize('STORE_ADMIN'));

router.get('/dashboard', getDashboardStats);

module.exports = router;
