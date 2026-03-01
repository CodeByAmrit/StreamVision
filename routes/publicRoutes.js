const express = require("express");
const router = express.Router();
const publicStreamController = require("../controllers/publicStreamController");
const db = require("../config/db");
const logger = require("../utils/logger");

// Render main Public DVR grid
router.get("/public/dvr/:dvrId", async (req, res) => {
  try {
    const dvrId = req.params.dvrId;
    const [rows] = await db.execute(
      `SELECT d.id, d.dvr_name, l.location_name
       FROM dvrs d
       LEFT JOIN locations l ON d.location_id = l.id
       WHERE d.id = ?`,
       [dvrId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send("DVR not found");
    }

    res.render("public", { nonce: res.locals.nonce, dvr: rows[0] });
  } catch (error) {
    logger.error("Error fetching public DVR info:", error);
    res.status(500).send("Internal server error");
  }
});

// Render focused Public Camera streamer
router.get("/public/dvr/:dvrId/camera/:cameraId", publicStreamController.renderDvrLiveStream);

// Fetch all enabled cameras for a specific DVR
router.get("/api/dvr/:id/cameras", async (req, res) => {
  try {
    const dvrId = req.params.id;
    if (!/^\d+$/.test(dvrId)) {
      return res.status(400).json({ error: "Invalid DVR ID" });
    }

    const [cameras] = await db.execute(
      `SELECT id, camera_name, rtsp_url 
       FROM cameras 
       WHERE dvr_id = ? AND enabled = 1`,
      [dvrId]
    );

    res.json(cameras);
  } catch (err) {
    logger.error("Error fetching cameras for public DVR view:", err);
    res.status(500).json({ error: "Failed to fetch cameras" });
  }
});

module.exports = router;
