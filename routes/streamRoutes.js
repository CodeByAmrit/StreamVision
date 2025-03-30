const express = require('express');
const { startStream, stopStream } = require('../controllers/streamController');

const router = express.Router();

// Start streaming a camera
router.get('/:id', startStream);

// Stop streaming a camera
router.get('/stop/:id', stopStream);

module.exports = router;
