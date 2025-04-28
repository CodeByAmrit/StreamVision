const db = require("../config/getConnection"); // Your MySQL db connection wrapper

class Camera {
    static async findById(req, res) {
        const cameraId = parseInt(req.params.id);
        if (!cameraId) return res.status(400).json({ error: "Invalid ID" });

        let connection;
        try {
            connection = await db.getConnection();
            const [rows] = await connection.execute(`SELECT * FROM cameras WHERE id = ?`, [cameraId]);
            
            return rows[0];
        } catch (error) {
            console.error("Error fetching camera:", error);
            
        }
        finally {
            if (connection) {
                connection.end();
            }
        }
    }
}

module.exports = Camera;