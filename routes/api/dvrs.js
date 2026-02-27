const express = require("express");
const router = express.Router();
const dvrController = require("../../controllers/dvrController");
const checkAuth = require("../../services/checkauth");
const db = require("../../config/getConnection");
const dvrManager = require("../../utils/streamManager"); // Need this for stats

// Get All DVRs with Stats (JSON)
router.get("/", checkAuth, async (req, res) => {
    try {
        let connection = await db.getConnection();
        
        // 1. Fetch DVRs with location and total cameras
        const [dvrs] = await connection.query(`
            SELECT 
                d.id, 
                d.dvr_name, 
                l.location_name,
                COUNT(c.id) as total_cameras
            FROM dvrs d 
            JOIN locations l ON d.location_id = l.id 
            LEFT JOIN cameras c ON d.id = c.dvr_id
            GROUP BY d.id, d.dvr_name, l.location_name
            ORDER BY d.id DESC
        `);

        // 2. Attach Stream Stats from dvrManager
        const activeStreams = dvrManager?.streams || new Map();
        const dvrStreamStats = new Map();

        // Aggregate active streams by DVR
        for (const [cameraId, stream] of activeStreams.entries()) {
            const dvrId = stream.dvrId;
            if (!dvrId) continue;

            if (!dvrStreamStats.has(dvrId)) {
                dvrStreamStats.set(dvrId, {
                    activeCameras: 0,
                    online: false,
                    lastActivity: null
                });
            }

            const stats = dvrStreamStats.get(dvrId);
            if (stream.isOnline()) {
                stats.online = true;
                stats.activeCameras += 1;
                stats.lastActivity = stream.activeSince; // or meta.lastFrameAt
            }
        }

        // Merge stats into DVR list
        const results = dvrs.map(dvr => {
            const stats = dvrStreamStats.get(dvr.id);
            return {
                ...dvr,
                isOnline: stats ? stats.online : false,
                activeCameras: stats ? stats.activeCameras : 0,
                lastActivity: stats ? stats.lastActivity : null,
                total_cameras: parseInt(dvr.total_cameras) || 0
            };
        });

        connection.end();
        res.json(results);

    } catch (error) {
        console.error("Error fetching DVR API:", error);
        res.status(500).json({ error: "Failed to load DVRs" });
    }
});

router.post("/", checkAuth, async (req, res) => {
    const { location_id, dvr_name, new_location } = req.body;
    
    if (!location_id || !dvr_name) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        let finalLocationId = location_id;

        if (location_id === "new") {
             if (!new_location) return res.status(400).json({ error: "New location name required" });
             const [locResult] = await connection.execute("INSERT INTO locations (location_name) VALUES (?)", [new_location]);
             finalLocationId = locResult.insertId;
        }

        const [result] = await connection.execute("INSERT INTO dvrs (location_id, dvr_name) VALUES (?, ?)", [finalLocationId, dvr_name]);
        res.status(201).json({ status: "success", id: result.insertId });
    } catch (error) {
        console.error("Error adding DVR:", error);
        res.status(500).json({ error: "Failed to add DVR" });
    } finally {
        if(connection) connection.end();
    }
});

router.put("/:id", checkAuth, dvrController.updateDvr); // This likely returns JSON already
router.delete("/:id", checkAuth, dvrController.deleteDvr); // This likely returns JSON already

router.get("/:id", checkAuth, async (req, res) => {
    try {
        const dvr = await dvrController.getDvrWithCamerasById(req.params.id);
        if (!dvr) return res.status(404).json({error: "DVR not found"});
        res.json(dvr);
    } catch(err) {
        res.status(500).json({error: "Server Error"});
    }
});

module.exports = router;
