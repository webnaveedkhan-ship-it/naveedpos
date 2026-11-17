const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  createSupplier,
  recordSupplierPayment,
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const { tenantMiddleware } = require('../middleware/tenantMiddleware');

router.use(protect);
router.use(tenantMiddleware);

router.route('/')
  .get(getSuppliers)
  .post(createSupplier);

router.route('/:id/pay')
  .post(recordSupplierPayment);

module.exports = router;
