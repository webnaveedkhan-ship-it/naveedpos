const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantGuard');

router.use(protect);
router.use(tenantGuard);

router.route('/').post(createOrder).get(getOrders);
router.route('/:id').get(getOrderById);

module.exports = router;
