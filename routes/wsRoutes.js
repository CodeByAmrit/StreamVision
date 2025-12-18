const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET /api/dvr/:dvrId/cameras
 */
router.get("/api/dvr/:dvrId/cameras", async (req, res) => {
  try {
    const { dvrId } = req.params;

    if (!/^\d+$/.test(dvrId)) {
      return res.status(400).json({ error: "Invalid DVR ID" });
    }

    const [cameras] = await db.execute(
      `SELECT id, camera_name
       FROM cameras
       WHERE dvr_id = ? AND enabled = 1`,
      [dvrId]
    );

    res.json(cameras);
  } catch (err) {
    console.error("Camera API error:", err);
    res.status(500).json({ error: "Failed to fetch cameras" });
  }
});

module.exports = router;
