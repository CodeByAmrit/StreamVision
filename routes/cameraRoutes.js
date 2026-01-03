const express = require("express");
const router = express.Router();
const cameraController = require("../controllers/camerasController");

// GET all cameras
router.get("/", cameraController.getAllCameras);

// GET cameras by DVR ID (for individual DVR view)
router.get("/dvr/:dvrId", cameraController.getCamerasByDvrId);

// GET single camera (optional, for edit page)
router.get("/edit/:id", async (req, res) => {
  await cameraController.getCameraById(req, res);
});

// POST add new camera
router.post("/add", cameraController.addCamera);

router.get("/add/:id", cameraController.renderAddCameraPage);

// PUT update camera
router.post("/edit/:id", cameraController.updateCamera);

// DELETE a camera
router.get("/delete/:id", cameraController.deleteCamera);

module.exports = router;
