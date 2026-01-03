const { getAllDvrs } = require("../controllers/dvrController");
const dvrManager = require('../utils/streamManager');

exports.getAnalyticsPage = async (req, res) => {
    try {
        const dvrs = await getAllDvrs();

        const activeDvrsSummary = {};
        for (const [dvrId, streamInstance] of dvrManager.streams.entries()) {
            activeDvrsSummary[dvrId] = {
                dvr_id: dvrId,
                activeCameraCount: streamInstance.activeCameraCount || 1,
                lastActivity: streamInstance.lastAccess || Date.now(),
            };
        }

        const activeDvrsWithDetails = dvrs
            .filter(dvr => activeDvrsSummary[dvr.id])
            .map(dvr => ({
                ...dvr,
                ...activeDvrsSummary[dvr.id],
            }));

        const total_dvrs = dvrs.length;
        const total_cameras = dvrs.reduce(
            (count, dvr) => count + (dvr.total_cameras || 0),
            0
        );

        const active_streams = dvrManager.streams.size;

        res.render("analytics", {
            title: "Analytics",
            user: req.user,
            total_dvrs,
            total_cameras,
            active_streams,
            dvrs,
            activeDvrs: activeDvrsWithDetails,
            activePage: 'analytics'
        });

    } catch (error) {
        console.error("Analytics loading error:", error);
        res.status(500).send("Something went wrong loading the analytics page.");
    }
};

exports.getAnalyticsData = async (req, res) => {
    try {
        const dvrs = await getAllDvrs();

        const activeDvrsSummary = {};
        for (const [dvrId, streamInstance] of dvrManager.streams.entries()) {
            activeDvrsSummary[dvrId] = {
                dvr_id: dvrId,
                activeCameraCount: streamInstance.activeCameraCount || 1,
                lastActivity: streamInstance.lastAccess || Date.now(),
            };
        }

        const activeDvrsWithDetails = dvrs
            .filter(dvr => activeDvrsSummary[dvr.id])
            .map(dvr => ({
                ...dvr,
                ...activeDvrsSummary[dvr.id],
            }));

        const total_dvrs = dvrs.length;
        const total_cameras = dvrs.reduce(
            (count, dvr) => count + (dvr.total_cameras || 0),
            0
        );

        const active_streams = dvrManager.streams.size;

        const dvrStreamsData = dvrs.map(dvr => {
            const activeDvr = activeDvrsWithDetails.find(ad => ad.id === dvr.id);
            return activeDvr ? activeDvr.activeCameraCount || 0 : 0;
        });

        const cameraStatusData = [active_streams, total_cameras - active_streams];

        res.json({
            dvrStreamsData,
            cameraStatusData,
            stats: {
                bandwidth: `${(Math.random() * 5).toFixed(1)} Gbps`,
                latency: `${Math.round(Math.random() * 200 + 50)}ms`,
                quality: `${Math.round(Math.random() * 10 + 90)}% HD`,
            },
            totalDvrs: total_dvrs,
            totalCameras: total_cameras,
            activeStreams: active_streams,
            activeDvrsCount: activeDvrsWithDetails.length,
            dvrNames: dvrs.map(dvr => dvr.dvr_name),
            dvrs: dvrs,
        });

    } catch (error) {
        console.error("Analytics data loading error:", error);
        res.status(500).json({ error: "Something went wrong loading analytics data." });
    }
};

