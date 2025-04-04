const db = require('../config/getConnection');

const renderDvrLiveStream = async (req, res) => {
    const dvrId = req.params.dvrId;
    let connection;

    try {
        connection = await db.getConnection();
        
        // Get DVR and related cameras
        const [[dvr]] = await connection.execute(`
            SELECT d.id, d.dvr_name, l.location_name 
            FROM dvrs d 
            JOIN locations l ON d.location_id = l.id 
            WHERE d.id = ?
        `, [dvrId]);

        const [cameras] = await connection.execute(`
            SELECT id, camera_name, rtsp_url FROM cameras WHERE dvr_id = ?
        `, [dvrId]);

        res.render('dvr_live_public', {
            dvr,
            cameras,
            title: `${dvr.dvr_name} - Live Stream`
        });

    } catch (error) {
        console.error("Error rendering DVR live stream:", error);
        res.status(500).send("Something went wrong");
    } finally {
        if (connection) connection.end();
    }
};

module.exports = {
    renderDvrLiveStream
};