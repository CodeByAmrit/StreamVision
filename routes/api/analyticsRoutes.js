const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analyticsController');
const checkAuth = require('../../services/checkauth');

router.get('/api/analytics/data', checkAuth, analyticsController.getAnalyticsData);

module.exports = router;
