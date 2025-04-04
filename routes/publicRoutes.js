const express = require('express');
const router = express.Router();
const publicStreamController = require("../controllers/publicStreamController");
const dvrController = require('../controllers/dvrController');
const fs = require('fs');
const path = require('path');
const { startStream, stopStream } = require('../utils/streamManager');

// Prevent browser caching of HLS segments
router.use('/streams', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// DVR Live Public View - Start Streams if Not Already Running
router.get('/public/dvr/:id', async (req, res) => {
    try {
        const dvr = await dvrController.getDvrWithCamerasById(req.params.id);

        dvr.cameras.forEach(cam => {
            const camPath = path.join(__dirname, '..', 'public', 'streams', `dvr_${dvr.id}`, `cam_${cam.id}`);
            fs.mkdirSync(camPath, { recursive: true });

            // Unique key per DVR camera
            const camKey = `${dvr.id}_${cam.id}`;
            startStream(camKey, cam.rtsp_url, camPath);
        });

        res.render('dvr_live_public', { dvr, cameras: dvr.cameras });
    } catch (error) {
        console.error("Error loading DVR stream page:", error);
        res.status(500).send("Failed to load DVR page");
    }
});

// DVR-level Live View Controller
router.get('/live/:dvrId', publicStreamController.renderDvrLiveStream);

// Optional Camera-level live view endpoints (currently commented out)
// router.get('/live/:dvrId/:cameraId', publicStreamController.renderCameraLiveStream);
// router.get('/live/:dvrId/:cameraId/stream.m3u8', publicStreamController.getHlsStream);

module.exports = router;
