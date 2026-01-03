const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const checkAuth = require("../services/checkauth");

router.get("/settings", checkAuth, settingsController.getSettingsPage);
router.post("/settings", checkAuth, settingsController.updateSettings);

module.exports = router;
