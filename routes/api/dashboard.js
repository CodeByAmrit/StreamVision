const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboardController");
const checkAuth = require("../../services/checkauth");

router.get("/", checkAuth, dashboardController.getDashboardData);

module.exports = router;
