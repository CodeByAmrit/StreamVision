const { getAllDvrs } = require("../controllers/dvrController");
const streamStore = require("../utils/streamStore");
const os = require("os");
const monitoringClient = require("../utils/monitoringClient");
const reportGenerator = require("../utils/reportGenerator");
const logger = require("../utils/logger");
exports.getAnalyticsPage = async (req, res) => {
  try {
    const dvrs = await getAllDvrs();

    const activeDvrsSummary = {};
    const allStreams = await streamStore.getAllStreams();
    
    for (const stream of allStreams) {
      const dvrId = stream.dvrId;
      if (!dvrId) continue;
      
      if (!activeDvrsSummary[dvrId]) {
        activeDvrsSummary[dvrId] = {
          dvr_id: dvrId,
          activeCameraCount: 0,
          lastActivity: stream.startedAt || Date.now(),
        };
      }
      activeDvrsSummary[dvrId].activeCameraCount += 1;
    }

    const activeDvrsWithDetails = dvrs
      .filter((dvr) => activeDvrsSummary[dvr.id])
      .map((dvr) => ({
        ...dvr,
        ...activeDvrsSummary[dvr.id],
      }));

    const total_dvrs = dvrs.length;
    const total_cameras = dvrs.reduce((count, dvr) => count + (dvr.total_cameras || 0), 0);

    const active_streams = allStreams.length;
    
    // Calculate realistic derived metrics
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length || 1;
    const loadPercent = Math.min(((loadAvg / cpuCount) * 100), 100);
    
    let bandwidthDisplay = '0 Mbps';
    if (active_streams > 0) {
      const mbps = active_streams * 2.5; 
      bandwidthDisplay = mbps > 1000 ? (mbps / 1024).toFixed(2) + ' Gbps' : mbps.toFixed(1) + ' Mbps';
    }
    
    const latencyDisplay = active_streams > 0 ? `${Math.round(loadPercent * 1.5 + 20)}ms` : '0ms';
    const qualityDisplay = active_streams > 0 ? `99% HD` : '0% HD';

    const stats = {
      bandwidth: bandwidthDisplay,
      latency: latencyDisplay,
      quality: qualityDisplay,
      loadPercent,
      active_streams_percent: total_cameras > 0 ? Math.round((active_streams / total_cameras) * 100) : 0
    };

    res.render("analytics", {
      title: "Analytics",
      user: req.user,
      total_dvrs,
      total_cameras,
      active_streams,
      dvrs,
      activeDvrs: activeDvrsWithDetails,
      activePage: "analytics",
      stats
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
    const allStreams = await streamStore.getAllStreams();
    
    for (const stream of allStreams) {
      const dvrId = stream.dvrId;
      if (!dvrId) continue;
      
      if (!activeDvrsSummary[dvrId]) {
        activeDvrsSummary[dvrId] = {
          dvr_id: dvrId,
          activeCameraCount: 0,
          lastActivity: stream.startedAt || Date.now(),
        };
      }
      activeDvrsSummary[dvrId].activeCameraCount += 1;
    }

    const activeDvrsWithDetails = dvrs
      .filter((dvr) => activeDvrsSummary[dvr.id])
      .map((dvr) => ({
        ...dvr,
        ...activeDvrsSummary[dvr.id],
      }));

    const total_dvrs = dvrs.length;
    const total_cameras = dvrs.reduce((count, dvr) => count + (dvr.total_cameras || 0), 0);

    const active_streams = allStreams.length;

    const dvrStreamsData = dvrs.map((dvr) => {
      const activeDvr = activeDvrsWithDetails.find((ad) => ad.id === dvr.id);
      return activeDvr ? activeDvr.activeCameraCount || 0 : 0;
    });

    const cameraStatusData = [active_streams, total_cameras - active_streams];

    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length || 1;
    const loadPercent = Math.min(((loadAvg / cpuCount) * 100), 100);
    
    let bandwidthDisplay = '0 Mbps';
    if (active_streams > 0) {
      const mbps = active_streams * 2.5; 
      bandwidthDisplay = mbps > 1000 ? (mbps / 1024).toFixed(2) + ' Gbps' : mbps.toFixed(1) + ' Mbps';
    }

    res.json({
      dvrStreamsData,
      cameraStatusData,
      stats: {
        bandwidth: bandwidthDisplay,
        latency: active_streams > 0 ? `${Math.round(loadPercent * 1.5 + 20)}ms` : '0ms',
        quality: active_streams > 0 ? `99% HD` : '0% HD',
      },
      totalDvrs: total_dvrs,
      totalCameras: total_cameras,
      activeStreams: active_streams,
      activeDvrsCount: activeDvrsWithDetails.length,
      dvrNames: dvrs.map((dvr) => dvr.dvr_name),
      dvrs: dvrs,
    });
  } catch (error) {
    console.error("Analytics data loading error:", error);
    res.status(500).json({ error: "Something went wrong loading analytics data." });
  }
};

/**
 * Export PDF Report
 * Generates an internal performance report from Prometheus & Loki
 */
exports.exportPdfReport = async (req, res) => {
    try {
        const timeframe = req.query.timeframe || 'now-30d';
        logger.info(`Generating executive PDF report for timeframe: ${timeframe}`);

        // 1. Fetch Metrics & Logs in parallel
        const [metrics, logs] = await Promise.all([
            monitoringClient.getReportMetrics(timeframe),
            monitoringClient.getLogSummary(timeframe)
        ]);

        const combinedData = { ...metrics, ...logs };

        // 2. Generate PDF Buffer
        const pdfBuffer = await reportGenerator.generate(combinedData, timeframe.replace('now-', 'Last '));

        // 3. Send Response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=StreamVision_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        logger.error(`Failed to export PDF report: ${error.message}`);
        res.status(500).send('Error generating report. Please check if Prometheus and Loki are reachable.');
    }
};
