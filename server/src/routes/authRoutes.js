const express = require('express');
const router = express.Router();
const {
  login,
  register,
  registerStoreAndTrial,
  impersonateTenant,
  identifyStore,
  getMe,
  logout,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/identify-store', identifyStore);
router.post('/register', register);
router.post('/register-trial', registerStoreAndTrial);
router.post('/impersonate/:tenantId', protect, authorize('SUPER_ADMIN'), impersonateTenant);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;