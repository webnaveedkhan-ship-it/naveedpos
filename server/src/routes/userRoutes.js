const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantGuard');

router.use(protect);
router.use(tenantGuard);
router.use(authorize('STORE_ADMIN'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);

module.exports = router;
