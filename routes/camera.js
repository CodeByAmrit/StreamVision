const express = require("express");
const router = express.Router();
const ffmpeg = require("fluent-ffmpeg");
const ffprobeStatic = require("ffprobe-static");
const Camera = require("../models/cameraModel"); // Adjust the path to your Camera model
const cameraController = require("../controllers/camerasController");

router.get("/:id", cameraController.getCameraById_ejs);

ffmpeg.setFfprobePath(ffprobeStatic.path);

router.get("/:id/ffprobe", async (req, res) => {
  try {
    const camera = await Camera.findById(req, res);
    // console.log("ffprobe", camera.rtsp_url);
    if (!camera) return res.status(404).json({ error: "Camera not found" });

    ffmpeg.ffprobe(camera.rtsp_url, (err, metadata) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json(metadata);
    });
  } catch (e) {
    console.error(e);
  }
});

module.exports = router;
