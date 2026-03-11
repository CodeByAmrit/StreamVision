const express = require("express");
const router = express.Router();
const User = require("../models/user");
const checkAuth = require("../services/checkauth");
const { getAllDvrs } = require("../controllers/dvrController");
const dvrManager = require("../utils/streamManager");
const bcrypt = require("bcrypt");
const os = require("os");
require("dotenv").config();
const { loginSchema, passwordChangeSchema, validate } = require("../middleware/validation");
const { authLimiter } = require("../middleware/security");

// Get all users
router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/logout", checkAuth, (req, res) => {
  User.logout(req, res);
});

// routes/dashboard.js
router.get("/dashboard", checkAuth, async (req, res) => {
  try {
    // 1. Fetch all DVRs from DB
    const dvrs = await getAllDvrs();

    // 2. Build active DVR summary from Map
    const activeDvrsSummary = {};

    for (const [cameraId, streamInstance] of dvrManager.streams.entries()) {
      // Only count actively online streams
      if (!streamInstance.isOnline()) continue;

      const dvrId = streamInstance.dvrId;
      if (!dvrId) continue;
      
      if (!activeDvrsSummary[dvrId]) {
        activeDvrsSummary[dvrId] = {
          dvr_id: dvrId,
          activeCameraCount: 0,
          lastActivity: streamInstance.meta.lastFrameAt || streamInstance.meta.startedAt || Date.now(),
        };
      }
      activeDvrsSummary[dvrId].activeCameraCount += 1;
    }

    // 3. Merge active DVRs with full DVR details
    const activeDvrsWithDetails = dvrs
      .filter((dvr) => activeDvrsSummary[dvr.id])
      .map((dvr) => ({
        ...dvr,
        ...activeDvrsSummary[dvr.id],
      }));

    // 4. Dashboard statistics
    const total_dvrs = dvrs.length;
    const total_cameras = dvrs.reduce((count, dvr) => count + (dvr.total_cameras || 0), 0);
    const active_streams = dvrManager.streams.size;

    // 5. Calculate Real System Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const serverLoadPercent = ((loadAvg / cpus.length) * 100).toFixed(1);

    const uptimeSeconds = os.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / (3600 * 24));
    let uptimeDisplay = `${uptimeDays} d`;
    if (uptimeDays === 0) {
       const uptimeHours = Math.floor(uptimeSeconds / 3600);
       uptimeDisplay = `${uptimeHours} h`;
    }

    const processMemoryMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

    const systemStats = {
      memoryUsagePercent,
      serverLoadPercent: Math.min(serverLoadPercent, 100), // Cap at 100% for UI
      uptimeDisplay,
      processMemoryMb
    };

    // 6. Render dashboard
    res.render("dashboard", {
      title: "Dashboard",
      user: req.user,
      total_dvrs,
      total_cameras,
      active_streams,
      dvrs,
      activeDvrs: activeDvrsWithDetails,
      systemStats
    });
  } catch (error) {
    console.error("Dashboard loading error:", error);
    res.status(500).send("Something went wrong loading the dashboard.");
  }
});

router.get("/", async (req, res) => {
  res.render("index");
});

router.get("/updates", (req, res) => {
  res.render("updates");
});

router.get("/privacy", (req, res) => {
  res.render("privacy");
});

router.post("/login", authLimiter, loginSchema, validate, async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await User.login(req, res);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/change-password", authLimiter, checkAuth, passwordChangeSchema, validate, async (req, res) => {
  try {
    const id = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ status: "error", message: "New passwords do not match." });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    // Verify current password
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: "error", message: "Current password is incorrect." });
    }

    await User.updatePassword(id, newPassword);

    return res.status(200).json({ status: "success", message: "Password changed successfully." });
  } catch (error) {
    console.error("Error during password change:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// router.post('/signup', async (req, res) => {
//     try {

//         const result = await User.create( req.body);
//         if (result.id){
//             res.status(201).json({ status: 'success', message: 'User created successfully' });
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         res.status(500).send('Internal Server Error');

//     }
// });

module.exports = router;
