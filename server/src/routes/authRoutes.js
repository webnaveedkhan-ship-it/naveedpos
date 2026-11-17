const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  login,
  register,
  registerStoreAndTrial,
  impersonateTenant,
  identifyStore,
  getMe,
  updateBusinessType,
  logout,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Strict Rate Limiter for Authentication endpoints
 * Protects against credential stuffing, brute-force dictionary attacks, and registration flood
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 25, // limit each IP to 25 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Input Sanitization Middleware for Auth endpoints
 * Strips NoSQL injection operators ($gt, $ne, $where) and sanitizes string inputs
 */
const sanitizeAuthInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (val) => {
      if (typeof val === 'string') {
        return val.trim();
      }
      if (typeof val === 'object' && val !== null) {
        // Strip out any MongoDB operator keys
        const cleaned = {};
        for (const [k, v] of Object.entries(val)) {
          if (!k.startsWith('$')) {
            cleaned[k] = sanitizeValue(v);
          }
        }
        return cleaned;
      }
      return val;
    };

    const sanitized = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeValue(value);
      }
    }
    if (sanitized.email && typeof sanitized.email === 'string') {
      sanitized.email = sanitized.email.toLowerCase();
    }
    req.body = sanitized;
  }
  next();
};

router.post('/login', authLimiter, sanitizeAuthInput, login);
router.post('/identify-store', authLimiter, sanitizeAuthInput, identifyStore);
router.post('/register', authLimiter, sanitizeAuthInput, register);
router.post('/register-trial', authLimiter, sanitizeAuthInput, registerStoreAndTrial);
router.post('/impersonate/:tenantId', protect, authorize('SUPER_ADMIN'), impersonateTenant);
router.get('/me', protect, getMe);
router.put('/business-type', protect, updateBusinessType);
router.post('/logout', logout);

module.exports = router;
