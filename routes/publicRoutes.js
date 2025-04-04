const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const publicStreamController = require('../controllers/publicStreamController');
const dvrController = require('../controllers/dvrController');
const { startStream, isStreamActive } = require('../utils/streamManager');

// Disable caching for HLS segments
router.use('/streams', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// DVR Live View (Public)
router.get('/public/dvr/:id', async (req, res) => {
  try {
    const dvrId = req.params.id;

    // Sanitize: Only digits allowed in ID (prevent traversal attacks)
    if (!/^\d+$/.test(dvrId)) {
      return res.status(400).send('Invalid DVR ID');
    }

    const dvr = await dvrController.getDvrWithCamerasById(dvrId);
    if (!dvr || !Array.isArray(dvr.cameras)) {
      return res.status(404).send('DVR or cameras not found');
    }

    for (const cam of dvr.cameras) {
      const camPath = path.join(__dirname, '..', 'public', 'streams', `dvr_${dvr.id}`, `cam_${cam.id}`);
      fs.mkdirSync(camPath, { recursive: true });

      const camKey = `${dvr.id}_${cam.id}`;
      if (!isStreamActive(camKey)) {
        startStream(camKey, cam.rtsp_url, camPath);
      }
    }

    res.render('dvr_live_public', { nonce: res.locals.nonce, dvr, cameras: dvr.cameras });
  } catch (error) {
    console.error('Error loading public DVR stream:', error);
    res.status(500).send('Failed to load DVR stream');
  }
});

module.exports = router;
