const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const checkAuth = require('../services/checkauth');

router.get('/analytics', checkAuth, analyticsController.getAnalyticsPage);

module.exports = router;
