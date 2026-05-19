const express = require("express");
const router = express.Router();
const dvrController = require("../controllers/dvrController");
const db = require("../config/db");
const dvrManager = require("../utils/streamManager");
const { dvrSchema, validate } = require("../middleware/validation");
const { probeRealtimeStatus } = require("../services/realtimeStatus.service");

router.get("/", dvrController.getAllDvrsPaginated);
router.post("/add", dvrSchema, validate, dvrController.addDvr);
router.put("/:id", dvrSchema, validate, dvrController.updateDvr);
router.delete("/:id", dvrController.deleteDvr);

router.get("/edit/:id", async (req, res) => {
  const dvrId = req.params.id;

  // Get DVR with associated cameras and location name
  const dvr = await dvrController.getDvrWithCamerasById(dvrId); // Custom function you define
  if (!dvr) return res.status(404).send("DVR not found");

  res.render("dvr_view", { dvr, user: req.user });
});

router.get("/add", dvrController.renderAddDvrForm);
router.get("/:id/metadata", async (req, res) => {
  const dvrId = req.params.id;

  const [rows] = await db.execute(
    `
    SELECT
      c.id AS camera_id,
      c.camera_name,
      s.resolution,
      s.fps,
      s.video_codec,
      h.is_online,
      h.last_frame_at
    FROM cameras c
    LEFT JOIN camera_stream_info s ON s.camera_id = c.id
    LEFT JOIN camera_health h ON h.camera_id = c.id
    WHERE c.dvr_id = ?
  `,
    [dvrId]
  );

  res.json(rows);
});

router.get("/status", async (req, res) => {
  const result = [];

  for (const [cameraId, stream] of dvrManager.streams.entries()) {
    result.push({
      cameraId,
      dvrId: stream.dvrId,
      online: stream.isOnline(),
      bitrate: stream.getBitrateKbps(),
      resolution: stream.meta.resolution,
      fps: stream.meta.fps,
      lastFrameAt: stream.meta.lastFrameAt,
    });
  }
  console.log("DVR Status:", result);
  res.json(result);
});

router.get("/:id/realtime", async (req, res) => {
  const dvrId = req.params.id;

  try {
    // Fetch all cameras for this DVR including their RTSP URLs
    const [cameras] = await db.execute(
      `SELECT id, camera_name, rtsp_url FROM cameras WHERE dvr_id = ?`,
      [dvrId]
    );

    if (!cameras || cameras.length === 0) {
      return res.json([]);
    }

    // Run ffprobe in parallel on all cameras
    const results = await Promise.all(
      cameras.map(async (cam) => {
        const status = await probeRealtimeStatus(cam.rtsp_url);
        return {
          id: cam.id,
          camera_name: cam.camera_name,
          online: status.online,
          resolution: status.resolution,
          codec: status.codec,
          details: status.details
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("Error fetching realtime status:", error);
    res.status(500).json({ error: "Failed to fetch realtime status" });
  }
});

module.exports = router;
