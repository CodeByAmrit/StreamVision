const db = require("../config/db"); // Your MySQL db connection wrapper

class Camera {
  static async findById(req, res) {
    const cameraId = parseInt(req.params.id);
    if (!cameraId) return res.status(400).json({ error: "Invalid ID" });

    try {
      const [rows] = await db.execute(`SELECT * FROM cameras WHERE id = ?`, [cameraId]);

      return rows[0];
    } catch (error) {
      console.error("Error fetching camera:", error);
    }
  }
}

module.exports = Camera;
