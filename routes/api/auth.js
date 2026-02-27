const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const checkAuth = require("../../services/checkauth");

// Login is already handling JSON in User.login
router.post("/login", (req, res) => {
    User.login(req, res);
});

// Logout needs to be wrapped to avoid redirect
router.post("/logout", checkAuth, (req, res) => {
    try {
        res.clearCookie("token");
        res.json({ status: "success", message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error during logout" });
    }
});

router.get("/me", checkAuth, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
