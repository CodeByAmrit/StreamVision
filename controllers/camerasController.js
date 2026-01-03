const db = require("../config/getConnection");
const { validationResult } = require("express-validator");

/**
 * Get all cameras
 */
const getAllCameras = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const query = `
            SELECT c.id, c.camera_name, c.rtsp_url, d.dvr_name, l.location_name
            FROM cameras c
            JOIN dvrs d ON c.dvr_id = d.id
            JOIN locations l ON d.location_id = l.id
            ORDER BY c.id DESC;
        `;
    const [rows] = await connection.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching cameras:", error);
    res.status(500).json({ error: "Failed to retrieve cameras" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

/**
 * Get a camera by ID
 */
const getCameraById = async (req, res) => {
  const cameraId = parseInt(req.params.id);
  if (!cameraId) return res.status(400).json({ error: "Invalid ID" });

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.execute(`SELECT * FROM cameras WHERE id = ?`, [cameraId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Camera not found" });
    }
    const [dvr] = await connection.execute(`SELECT dvr_name FROM dvrs WHERE id = ?`, [
      rows[0].dvr_id,
    ]);
    // console.log(rows);
    res.render("edit_camera", { dvr: dvr[0], cameraId, camera: rows[0] });
  } catch (error) {
    console.error("Error fetching camera:", error);
    res.status(500).json({ error: "Failed to retrieve camera" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

/**
 * Get all cameras for a specific DVR
 */
const getCamerasByDvrId = async (req, res) => {
  const dvrId = parseInt(req.params.dvrId);
  if (!dvrId) return res.status(400).json({ error: "Invalid DVR ID" });

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM cameras WHERE dvr_id = ? ORDER BY id DESC`,
      [dvrId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching cameras by DVR ID:", error);
    res.status(500).json({ error: "Failed to retrieve cameras" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

/**
 * Add a new camera
 */
const addCamera = async (req, res) => {
  const { dvr_id, camera_name, rtsp_url } = req.body;

  if (!dvr_id || !camera_name || !rtsp_url) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  let connection;
  try {
    connection = await db.getConnection();
    const insertQuery = `
            INSERT INTO cameras (dvr_id, camera_name, rtsp_url)
            VALUES (?, ?, ?)
        `;
    const [result] = await connection.execute(insertQuery, [dvr_id, camera_name, rtsp_url]);
    res.status(201).redirect(`/dvr/edit/${dvr_id}`);
  } catch (error) {
    console.error("Error adding camera:", error);
    res.status(500).json({ error: "Failed to add camera" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

const renderAddCameraPage = async (req, res) => {
  const dvrId = req.params.id;

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.execute(
      `
            SELECT d.id, d.dvr_name, l.location_name 
            FROM dvrs d
            JOIN locations l ON d.location_id = l.id
            WHERE d.id = ?
        `,
      [dvrId]
    );

    if (rows.length === 0) {
      return res.status(404).send("DVR not found");
    }

    const dvr = rows[0];

    res.render("add_camera", {
      title: "Add Camera",
      dvr: dvr, // Pass DVR object to EJS
    });
  } catch (error) {
    console.error("Error loading add camera page:", error);
    res.status(500).send("Server Error");
  } finally {
    if (connection) connection.end();
  }
};

/**
 * Delete a camera by ID
 */
const deleteCamera = async (req, res) => {
  const cameraId = parseInt(req.params.id);
  if (!cameraId) return res.status(400).json({ error: "Invalid ID" });

  let connection;
  try {
    connection = await db.getConnection();
    const [result] = await connection.execute(`DELETE FROM cameras WHERE id = ?`, [cameraId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Camera not found" });
    }
    // res.json({ message: `Camera ${cameraId} deleted successfully` });
    res.redirect(req.get("referer"));
  } catch (error) {
    console.error("Error deleting camera:", error);
    res.status(500).json({ error: "Failed to delete camera" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

/**
 * Update a camera
 */
const updateCamera = async (req, res) => {
  const cameraId = parseInt(req.params.id);
  const { camera_name, rtsp_url } = req.body;

  if (!camera_name || !rtsp_url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [result] = await connection.execute(
      `UPDATE cameras SET camera_name = ?, rtsp_url = ? WHERE id = ?`,
      [camera_name, rtsp_url, cameraId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Camera not found" });
    }

    res.redirect(req.get("referer"));
  } catch (error) {
    console.error("Error updating camera:", error);
    res.status(500).json({ error: "Failed to update camera" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

const getCameraById_ejs = async (req, res) => {
  const cameraId = req.params.id;
  let connection;

  try {
    connection = await db.getConnection();

    const [rows] = await connection.execute(
      `
        SELECT c.*, dvr.dvr_name, dvr.id AS dvr_id, l.location_name AS location_name
        FROM cameras c
        JOIN dvrs dvr ON c.dvr_id = dvr.id
        JOIN locations l ON dvr.location_id = l.id
        WHERE c.id = ?
      `,
      [cameraId]
    );

    const camera = rows[0];

    if (!camera) {
      return res.status(404).send("Camera not found");
    }

    res.render("camera", {
      camera,
    });
  } catch (err) {
    console.error("Error loading camera view:", err);
    res.status(500).send("Internal Server Error");
  } finally {
    if (connection) connection.end();
  }
};

module.exports = {
  getAllCameras,
  getCameraById,
  getCamerasByDvrId,
  addCamera,
  deleteCamera,
  updateCamera,
  renderAddCameraPage,
  getCameraById_ejs,
};
