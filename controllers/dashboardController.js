const { getAllDvrs } = require("../controllers/dvrController");
const dvrManager = require("../utils/streamManager");

const getDashboardData = async (req, res) => {
  try {
    // 1. Fetch all DVRs from DB
    const dvrs = await getAllDvrs();

    // 2. Build active DVR summary from Map
    const activeDvrsSummary = {};

    for (const [dvrId, streamInstance] of dvrManager.streams.entries()) {
      activeDvrsSummary[dvrId] = {
        dvr_id: dvrId,
        activeCameraCount: streamInstance.activeCameraCount || 1,
        lastActivity: streamInstance.lastAccess || Date.now(),
      };
    }

    // 3. Merge active DVRs with full DVR details
    const activeDvrsWithDetails = dvrs
      .filter((dvr) => activeDvrsSummary[dvr.id])
      .map((dvr) => ({
        ...dvr,
        ...activeDvrsSummary[dvr.id],
      }));

    // 4. Dashboard statistics
    const total_dvrs = dvrs.length;
    const total_cameras = dvrs.reduce((count, dvr) => count + (dvr.total_cameras || 0), 0);

    const active_streams = dvrManager.streams.size;

    // 5. Return JSON
    res.json({
      title: "Dashboard",
      user: req.user,
      total_dvrs,
      total_cameras,
      active_streams,
      dvrs,
      activeDvrs: activeDvrsWithDetails,
    });
  } catch (error) {
    console.error("Dashboard loading error:", error);
    res.status(500).json({ error: "Something went wrong loading the dashboard." });
  }
};

module.exports = {
  getDashboardData,
};
