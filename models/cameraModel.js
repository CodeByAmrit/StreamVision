const fs = require('fs');
const path = require('path');

const camerasFile = path.join(__dirname, '../data/cameras.json');

// Ensure the file exists
if (!fs.existsSync(camerasFile)) {
    fs.writeFileSync(camerasFile, JSON.stringify([]));
}

// Read cameras from file
const getCameras = () => {
    try {
        return JSON.parse(fs.readFileSync(camerasFile, 'utf-8'));
    } catch (error) {
        console.error('Error reading cameras.json:', error);
        return [];
    }
};

// Save cameras to file
const saveCameras = (cameras) => {
    try {
        fs.writeFileSync(camerasFile, JSON.stringify(cameras, null, 2));
    } catch (error) {
        console.error('Error writing to cameras.json:', error);
    }
};

module.exports = { getCameras, saveCameras };
