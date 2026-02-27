const express = require("express");
const router = express.Router();
const cameraController = require("../../controllers/camerasController");
const checkAuth = require("../../services/checkauth");
const db = require("../../config/getConnection");
const { extractAndStoreRtspMetadata } = require("../../services/rtspMetadata.service");

router.get("/", checkAuth, cameraController.getAllCameras);
router.get("/dvr/:dvrId", checkAuth, cameraController.getCamerasByDvrId);

// Get Single Camera (JSON)
router.get("/:id", checkAuth, async (req, res) => {
    const cameraId = parseInt(req.params.id);
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute(`
            SELECT c.*, d.dvr_name, l.location_name
            FROM cameras c
            JOIN dvrs d ON c.dvr_id = d.id
            JOIN locations l ON d.location_id = l.id
            WHERE c.id = ?
        `, [cameraId]);
        
        if (rows.length === 0) return res.status(404).json({ error: "Camera not found" });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    } finally {
        if(connection) connection.end();
    }
});

// Add Camera (API version)
router.post("/", checkAuth, async (req, res) => {
    const { dvr_id, camera_name, rtsp_url } = req.body;
    if (!dvr_id || !camera_name || !rtsp_url) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute(
            "INSERT INTO cameras (dvr_id, camera_name, rtsp_url) VALUES (?, ?, ?)",
            [dvr_id, camera_name, rtsp_url]
        );
        const cameraId = result.insertId;
        
        extractAndStoreRtspMetadata(cameraId, rtsp_url).catch(console.warn);
        
        res.status(201).json({ status: "success", id: cameraId });
    } catch (error) {
        console.error("Error adding camera:", error);
        res.status(500).json({ error: "Failed to add camera" });
    } finally {
        if (connection) connection.end();
    }
});

// Update Camera (API Version)
router.put("/:id", checkAuth, async (req, res) => {
    // cameraController.updateCamera redirects.
    // Copy logic for JSON.
    const cameraId = parseInt(req.params.id);
    const { camera_name, rtsp_url } = req.body;

    if (!camera_name || !rtsp_url) return res.status(400).json({ error: "Missing required fields" });

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute(
            "UPDATE cameras SET camera_name = ?, rtsp_url = ? WHERE id = ?",
            [camera_name, rtsp_url, cameraId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Camera not found" });
        res.json({ status: "success" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update camera" });
    } finally {
        if(connection) connection.end();
    }
});

router.delete("/:id", checkAuth, async (req, res) => {
     // cameraController.deleteCamera redirects.
     const cameraId = parseInt(req.params.id);
     let connection;
     try {
         connection = await db.getConnection();
         const [result] = await connection.execute("DELETE FROM cameras WHERE id = ?", [cameraId]);
         if (result.affectedRows === 0) return res.status(404).json({ error: "Camera not found" });
         res.json({ status: "success" });
     } catch (error) {
         res.status(500).json({ error: "Failed to delete camera" });
     } finally {
         if(connection) connection.end();
     }
});

module.exports = router;
