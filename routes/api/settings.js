const express = require("express");
const router = express.Router();
const Setting = require("../../models/settingModel");
const User = require("../../models/user");
const checkAuth = require("../../services/checkauth");
const bcrypt = require("bcrypt");

// Get all settings
router.get("/", checkAuth, async (req, res) => {
    try {
        const settings = await Setting.getAll();
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Update settings
router.post("/", checkAuth, async (req, res) => {
    try {
        const { app_name } = req.body;
        await Setting.update("app_name", app_name);
        res.json({ status: "success", message: "Settings updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Change Password
router.post("/change-password", checkAuth, async (req, res) => {
    try {
        const id = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: "error", message: "New passwords do not match." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }

        const isMatch = bcrypt.compareSync(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: "error", message: "Current password is incorrect." });
        }

        await User.updatePassword(id, newPassword);
        res.status(200).json({ status: "success", message: "Password changed successfully." });
    } catch (error) {
        console.error("Error during password change:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
});

module.exports = router;
