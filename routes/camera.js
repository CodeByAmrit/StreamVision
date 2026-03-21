const express = require("express");
const router = express.Router();
const { spawnSync } = require("child_process");
const Camera = require("../models/cameraModel"); // Adjust the path to your Camera model
const cameraController = require("../controllers/camerasController");

router.get("/:id", cameraController.getCameraById_ejs);

router.get("/:id/ffprobe", async (req, res) => {
  try {
    const camera = await Camera.findById(req, res);
    if (!camera) return res.status(404).json({ error: "Camera not found" });

    const result = spawnSync("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      camera.rtsp_url,
    ]);

    if (result.error) {
      console.error("FFprobe error:", result.error);
      return res.status(500).json({ error: "Failed to probe stream" });
    }

    try {
      const metadata = JSON.parse(result.stdout.toString());
      return res.json(metadata);
    } catch (parseError) {
      return res.status(500).json({ error: "Failed to parse ffprobe output" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
