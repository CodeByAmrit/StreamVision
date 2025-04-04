const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camerasController');

// GET all
router.get('/', cameraController.getAllCameras);

// POST add new
router.post('/', cameraController.addCamera);

// DELETE
router.delete('/:id', cameraController.deleteCamera);

// PUT update
router.put('/:id', cameraController.updateCamera);

module.exports = router;
