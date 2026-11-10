const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  createSupplier,
  recordSupplierPayment,
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(createSupplier);

router.route('/:id/pay')
  .post(recordSupplierPayment);

module.exports = router;
