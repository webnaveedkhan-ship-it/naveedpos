const express = require('express');
const router = express.Router();
const {
  getCashDrawerSummaryToday,
  reconcileCashDrawer,
  getCashDrawerHistory,
} = require('../controllers/cashDrawerController');
const { protect } = require('../middleware/authMiddleware');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(tenantMiddleware);

router.get('/summary-today', getCashDrawerSummaryToday);
router.post('/reconcile', reconcileCashDrawer);
router.get('/history', getCashDrawerHistory);

module.exports = router;
