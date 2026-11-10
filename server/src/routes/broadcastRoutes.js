const express = require('express');
const router = express.Router();
const { getActiveBroadcast } = require('../controllers/superAdminController');

// Public/Merchant route to fetch active system broadcast announcement
router.get('/active', getActiveBroadcast);

module.exports = router;
