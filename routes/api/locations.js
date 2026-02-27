const express = require("express");
const router = express.Router();
const checkAuth = require("../../services/checkauth");
const db = require("../../config/getConnection");

router.get("/", checkAuth, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute("SELECT * FROM locations ORDER BY location_name ASC");
        res.json(rows);
    } catch (error) {
        console.error("Error fetching locations:", error);
        res.status(500).json({ error: "Failed to fetch locations" });
    } finally {
        if (connection) connection.end();
    }
});

module.exports = router;
