const express = require('express');
const router = express.Router();
const { exportShopBackup } = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/export', exportShopBackup);

module.exports = router;
