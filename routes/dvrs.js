const express = require("express");
const router = express.Router();
const dvrController = require("../controllers/dvrController");
const db = require("../config/db");
const dvrManager = require("../utils/streamManager");

router.get("/", dvrController.getAllDvrsPaginated);
router.post("/add", dvrController.addDvr);
router.put("/:id", dvrController.updateDvr);
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

module.exports = router;
