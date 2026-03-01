const db = require("../config/db"); // Your DB connection
const streamStore = require("../utils/streamStore");
const { logActivity } = require("../utils/activityLogger");

/**
 * Get all DVRs with location name and total cameras count
 */
const getAllDvrs = async (req, res) => {
  try {
    const query = `
            SELECT d.id, d.dvr_name, l.location_name, COUNT(c.id) AS total_cameras
            FROM dvrs d
            JOIN locations l ON d.location_id = l.id
            LEFT JOIN cameras c ON d.id = c.dvr_id
            GROUP BY d.id, d.dvr_name, l.location_name
            ORDER BY d.id DESC;
        `;
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    console.error("Error fetching DVRs:", error);
    res.status(500).json({ error: "Failed to retrieve DVRs" });
  }
};

/**
 * Add a new DVR
 */
const addDvr = async (req, res) => {
  let { location_id, dvr_name, new_location } = req.body;

  if (!location_id || !dvr_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // If user selected "Add New Location"
    if (location_id === "new") {
      if (!new_location) {
        return res.status(400).json({ error: "New location name required" });
      }

      // Insert the new location
      const [locationResult] = await db.execute(
        `INSERT INTO locations (location_name) VALUES (?)`,
        [new_location]
      );

      // Replace location_id with the new one
      location_id = locationResult.insertId;
    }

    // Insert DVR
    const [result] = await db.execute(
      `INSERT INTO dvrs (location_id, dvr_name) VALUES (?, ?)`,
      [location_id, dvr_name]
    );

    logActivity("dvr", "added", `Created new DVR: ${dvr_name}`);

    res.status(201).redirect("/dvr");
  } catch (error) {
    console.error("Error adding DVR:", error);
    res.status(500).json({ error: "Failed to add DVR" });
  }
};

/**
 * Update a DVR
 */
const updateDvr = async (req, res) => {
  const dvrId = parseInt(req.params.id);
  const { dvr_name, location_id } = req.body;

  if (!dvr_name || !location_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `UPDATE dvrs SET dvr_name = ?, location_id = ? WHERE id = ?`;
    const [result] = await db.execute(query, [dvr_name, location_id, dvrId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "DVR not found" });
    }

    logActivity("dvr", "updated", `Updated DVR: ${dvr_name}`);

    res.json({ message: `DVR ${dvrId} updated successfully` });
  } catch (error) {
    console.error("Error updating DVR:", error);
    res.status(500).json({ error: "Failed to update DVR" });
  }
};

/**
 * Delete a DVR
 */
const deleteDvr = async (req, res) => {
  const dvrId = parseInt(req.params.id);

  if (!dvrId) return res.status(400).json({ error: "Invalid DVR ID" });

  try {
    const [result] = await db.execute(`DELETE FROM dvrs WHERE id = ?`, [dvrId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "DVR not found" });
    }

    logActivity("dvr", "deleted", `Deleted a DVR (${dvrId})`);

    res.json({ success: true, message: `DVR ${dvrId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting DVR:", error);
    res.status(500).json({ error: "Failed to delete DVR" });
  }
};

const getDvrsWithCameras = async (req, res) => {
  try {
    const [dvrs] = await db.query(`
            SELECT dvrs.id, dvrs.dvr_name, locations.location_name
            FROM dvrs
            JOIN locations ON dvrs.location_id = locations.id
        `);

    const [cameras] = await db.query(`SELECT * FROM cameras`);

    const dvrsWithCameras = dvrs.map((dvr) => ({
      ...dvr,
      cameras: cameras.filter((cam) => cam.dvr_id === dvr.id),
    }));

    res.render("dvr", { dvrsWithCameras, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const getAllDvrsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all"; // ADD THIS LINE

    let whereClause = "";
    let params = [];

    if (search) {
      whereClause = "WHERE d.dvr_name LIKE ? OR l.location_name LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Single query to get DVRs with camera counts
    const [dvrs] = await db.query(
      `
            SELECT 
                d.*, 
                l.location_name,
                COUNT(c.id) as totalCameras
            FROM dvrs d 
            JOIN locations l ON d.location_id = l.id 
            LEFT JOIN cameras c ON d.id = c.dvr_id AND c.enabled = 1
            ${whereClause}
            GROUP BY d.id
            ORDER BY d.id DESC
            LIMIT ? OFFSET ?
        `,
      [...params, limit, offset]
    );

    // Get total count for pagination
    const [[{ total }]] = await db.query(
      `
            SELECT COUNT(DISTINCT d.id) as total 
            FROM dvrs d 
            JOIN locations l ON d.location_id = l.id 
            ${whereClause}
        `,
      params
    );

    // Build DVR-level aggregation
    const dvrStreamStats = new Map();

    const activeStreams = streamStore.getAllStreams();

    for (const stream of activeStreams) {
      const dvrId = stream.dvrId;
      if (!dvrId) continue;

      if (!dvrStreamStats.has(dvrId)) {
        dvrStreamStats.set(dvrId, {
          activeCameras: 0,
          online: false,
          lastActivity: null,
          cameras: [],
        });
      }

      const stats = dvrStreamStats.get(dvrId);

      stats.online = true;
      stats.activeCameras += 1;
      stats.lastActivity = stream.startedAt;

      stats.cameras.push({
        cameraId: stream.cameraId,
        resolution: "Auto", // Removed FFmpeg metadata parsing for performance here
        fps: "Auto",
        bitrate: "Auto",
      });
    }

    // Add online status and active camera count
    for (let dvr of dvrs) {
      const stats = dvrStreamStats.get(dvr.id);

      dvr.isOnline = stats ? stats.online : false;
      dvr.activeCameras = stats ? stats.activeCameras : 0;
      dvr.lastActivity = stats ? stats.lastActivity : null;

      dvr.streamCameras = stats ? stats.cameras : [];

      dvr.totalCameras = parseInt(dvr.totalCameras) || 0;
    }

    // Calculate statistics (on all DVRs, not filtered)
    const onlineCount = dvrs.filter((dvr) => dvr.isOnline === true).length;
    const totalCameras = dvrs.reduce((sum, dvr) => sum + dvr.totalCameras, 0);

    res.render("dvr", {
      dvrsWithCameras: dvrs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit: limit,
      search: search,
      status: status,
      totalDvrs: total,
      onlineCount: onlineCount,
      totalCameras: totalCameras,
      user: req.user,
    });
  } catch (error) {
    console.error("Error fetching DVRs:", error);
    res.status(500).render("error", {
      message: "Failed to load DVRs",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

async function getDvrWithCamerasById(dvrId) {
  try {
    // Fetch DVR and location name
    const [dvrRows] = await db.query(
      `
            SELECT dvrs.*, locations.location_name 
            FROM dvrs 
            LEFT JOIN locations ON dvrs.location_id = locations.id 
            WHERE dvrs.id = ?
        `,
      [dvrId]
    );

    if (dvrRows.length === 0) return null;

    const dvr = dvrRows[0];

    // Fetch all cameras for this DVR
    const [cameraRows] = await db.query(
      `
            SELECT * FROM cameras 
            WHERE dvr_id = ?
        `,
      [dvrId]
    );

    // Attach cameras to DVR object
    dvr.cameras = cameraRows;

    return dvr;
  } catch (error) {
    console.error("Error in getDvrWithCamerasById:", error);
    throw error;
  }
}

const renderAddDvrForm = async (req, res) => {
  try {
    // Fetch locations to populate the dropdown
    const [locations] = await db.execute("SELECT id, location_name FROM locations");

    res.render("add_dvr", {
      title: "Add DVR",
      locations: locations,
      user: req.user,
    });
  } catch (error) {
    console.error("Error rendering Add DVR form:", error);
    res.status(500).send("Failed to load form");
  }
};

module.exports = {
  getAllDvrs,
  addDvr,
  updateDvr,
  deleteDvr,
  getDvrsWithCameras,
  getAllDvrsPaginated,
  getDvrWithCamerasById,
  renderAddDvrForm,
};
