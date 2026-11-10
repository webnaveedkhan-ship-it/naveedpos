const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  recordKhataPayment,
  getKhataMetrics,
} = require('../controllers/khataController');
const { protect } = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantGuard');

// All Khata endpoints require authentication and active tenant status
router.use(protect);
router.use(tenantGuard);

router.get('/metrics', getKhataMetrics);
router.route('/customers').get(getCustomers).post(createCustomer);
router.route('/customers/:id').get(getCustomerById);
router.post('/customers/:id/payment', recordKhataPayment);

module.exports = router;
