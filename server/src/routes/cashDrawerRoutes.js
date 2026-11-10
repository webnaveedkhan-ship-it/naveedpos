const express = require('express');
const router = express.Router();
const {
  getCashDrawerSummaryToday,
  reconcileCashDrawer,
  getCashDrawerHistory,
} = require('../controllers/cashDrawerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary-today', getCashDrawerSummaryToday);
router.post('/reconcile', reconcileCashDrawer);
router.get('/history', getCashDrawerHistory);

module.exports = router;
