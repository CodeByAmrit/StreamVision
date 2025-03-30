const fs = require('fs');
const path = require('path');

const camerasFile = path.join(__dirname, '../data/cameras.json');

// Ensure cameras.json exists
if (!fs.existsSync(camerasFile)) {
    fs.writeFileSync(camerasFile, JSON.stringify([]), 'utf8');
}

/**
 * Read cameras from file
 * @returns {Array} List of cameras
 */
const readCameras = () => {
    try {
        const data = fs.readFileSync(camerasFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading cameras:', error);
        return [];
    }
};

/**
 * Save cameras to file
 * @param {Array} cameras - Updated list of cameras
 */
const saveCameras = (cameras) => {
    try {
        fs.writeFileSync(camerasFile, JSON.stringify(cameras, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving cameras:', error);
    }
};

/**
 * Get all cameras
 */
const getAllCameras = (req, res) => {
    try {
        res.json(readCameras());
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve cameras' });
    }
};

/**
 * Add a new camera
 */
const addCamera = (req, res) => {
    try {
        const cameras = readCameras();
        const newId = cameras.length ? Math.max(...cameras.map(c => c.id)) + 1 : 1;
        const newCamera = { id: newId, ...req.body };

        cameras.push(newCamera);
        saveCameras(cameras);

        res.status(201).json(newCamera);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add camera' });
    }
};

/**
 * Delete a camera
 */
const deleteCamera = (req, res) => {
    try {
        const cameraId = parseInt(req.params.id);
        let cameras = readCameras();

        cameras = cameras.filter(c => c.id !== cameraId);
        saveCameras(cameras);

        res.json({ message: `Camera ${cameraId} deleted` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete camera' });
    }
};

module.exports = { getAllCameras, addCamera, deleteCamera, readCameras, saveCameras };
