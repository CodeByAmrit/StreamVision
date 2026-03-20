const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const checkAuth = require("../services/checkauth");

router.get("/analytics", checkAuth, analyticsController.getAnalyticsPage);
router.get("/analytics/export-pdf", checkAuth, analyticsController.exportPdfReport);
router.get("/analytics/test-pdf", checkAuth, analyticsController.exportTestPdfReport);
router.get("/api/reports/monthly", checkAuth, analyticsController.getMonthlyReportApi);

module.exports = router;
