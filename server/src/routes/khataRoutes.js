const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  recordKhataPayment,
  recordUdharGiven,
  getKhataMetrics,
  getKhataTransactions,
} = require('../controllers/khataController');
const { protect } = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantGuard');

// All Khata endpoints require authentication and active tenant status
router.use(protect);
router.use(tenantGuard);

router.get('/metrics', getKhataMetrics);
router.get('/transactions', getKhataTransactions);
router.route('/customers').get(getCustomers).post(createCustomer);
router.route('/customers/:id').get(getCustomerById);
router.post('/customers/:id/payment', recordKhataPayment);
router.post('/customers/:id/udhar', recordUdharGiven);

// Direct root routes for /api/customers mount
router.get('/transactions', getKhataTransactions);
router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomerById);
router.post('/:id/payment', recordKhataPayment);
router.post('/:id/udhar', recordUdharGiven);

module.exports = router;
