const express = require('express');
const { getAllCameras, addCamera, deleteCamera } = require('../controllers/cameraController');

const router = express.Router();

// Get all cameras
router.get('/', getAllCameras);

// Add a new camera
router.post('/', addCamera);

// Delete a camera by ID
router.delete('/:id', deleteCamera);

module.exports = router;
