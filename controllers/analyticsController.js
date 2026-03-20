const { getAllDvrs } = require("../controllers/dvrController");
const streamStore = require("../utils/streamStore");
const os = require("os");
const monitoringClient = require("../utils/monitoringClient");
const reportGenerator = require("../utils/reportGenerator");
const logger = require("../utils/logger");

/**
 * Analytics Dashboard Data
 */
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

    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length || 1;
    const loadPercent = Math.min((loadAvg / cpuCount) * 100, 100);

    let bandwidthDisplay = "0 Mbps";
    if (active_streams > 0) {
      const mbps = active_streams * 2.5;
      bandwidthDisplay =
        mbps > 1000 ? (mbps / 1024).toFixed(2) + " Gbps" : mbps.toFixed(1) + " Mbps";
    }

    res.render("analytics", {
      total_dvrs,
      total_cameras,
      active_streams,
      dvrs,
      activeDvrs: activeDvrsWithDetails,
      activePage: "analytics",
      stats: {
        bandwidth: bandwidthDisplay,
        latency: active_streams > 0 ? `${Math.round(loadPercent * 1.5 + 20)}ms` : "0ms",
        quality: active_streams > 0 ? `99% HD` : "0% HD",
        loadPercent,
        active_streams_percent:
          total_cameras > 0 ? Math.round((active_streams / total_cameras) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error(`Analytics view error: ${error.message}`);
    res.status(500).send("Error loading analytics page");
  }
};

/**
 * Analytics API Data
 */
exports.getAnalyticsData = async (req, res) => {
  try {
    const dvrs = await getAllDvrs();
    const allStreams = await streamStore.getAllStreams();

    const activeDvrsSummary = {};
    for (const stream of allStreams) {
      const dvrId = stream.dvrId;
      if (!dvrId) continue;
      if (!activeDvrsSummary[dvrId]) {
        activeDvrsSummary[dvrId] = { dvr_id: dvrId, activeCameraCount: 0 };
      }
      activeDvrsSummary[dvrId].activeCameraCount += 1;
    }

    const activeDvrsWithDetails = dvrs
      .filter((dvr) => activeDvrsSummary[dvr.id])
      .map((dvr) => ({ ...dvr, ...activeDvrsSummary[dvr.id] }));

    const active_streams = allStreams.length;
    const total_cameras = dvrs.reduce((count, dvr) => count + (dvr.total_cameras || 0), 0);
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length || 1;
    const loadPercent = Math.min((loadAvg / cpuCount) * 100, 100);

    let bandwidthDisplay = "0 Mbps";
    if (active_streams > 0) {
      const mbps = active_streams * 2.5;
      bandwidthDisplay =
        mbps > 1000 ? (mbps / 1024).toFixed(2) + " Gbps" : mbps.toFixed(1) + " Mbps";
    }

    res.json({
      dvrStreamsData: dvrs.map((dvr) => {
        const activeDvr = activeDvrsWithDetails.find((ad) => ad.id === dvr.id);
        return activeDvr ? activeDvr.activeCameraCount : 0;
      }),
      cameraStatusData: [active_streams, total_cameras - active_streams],
      stats: {
        bandwidth: bandwidthDisplay,
        latency: active_streams > 0 ? `${Math.round(loadPercent * 1.5 + 20)}ms` : "0ms",
        quality: active_streams > 0 ? `99% HD` : "0% HD",
      },
      totalDvrs: dvrs.length,
      totalCameras: total_cameras,
      activeStreams: active_streams,
      activeDvrsCount: activeDvrsWithDetails.length,
      dvrNames: dvrs.map((dvr) => dvr.dvr_name),
      dvrs,
    });
  } catch (error) {
    logger.error(`Analytics API error: ${error.message}`);
    res.status(500).json({ error: "Failed to load analytics data" });
  }
};

/**
 * Export PDF Report (Active Prometheus Data)
 */
exports.exportPdfReport = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || "now-30d";
    logger.info(`🔍 PDF Export: Fetching metrics for timeframe: ${timeframe}`);

    const [reportData, allStreams, dvrs] = await Promise.all([
      monitoringClient.asyncGetStructuredReport(timeframe),
      streamStore.getAllStreams(),
      getAllDvrs(),
    ]);

    // Inject Asset Awareness
    reportData.activeCameras = allStreams.length;
    reportData.totalCameras = dvrs.reduce((sum, dvr) => sum + (dvr.total_cameras || 0), 0);

    const pdfBuffer = await reportGenerator.generate(
      reportData,
      timeframe.replace("now-", "Last ").replace("d", " Days").replace("h", " Hours")
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=StreamVision_Report_${new Date().toISOString().split("T")[0]}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Live PDF Export Error: ${error.message}`);
    res.status(500).send(`Export Failed: ${error.message}`);
  }
};

/**
 * Export Test PDF Report (Mock Data)
 */
exports.exportTestPdfReport = async (req, res) => {
  try {
    logger.info("🧪 Generating TEST PDF report with mock data...");
    const mockData = {
      avgCpu: "45.2",
      avgRam: "62.8",
      totalRequests: 125430,
      errorRate: "0.15",
      activeCameras: 18,
      totalCameras: 20,
      criticalErrors: 2,
      services: [
        {
          name: "Global Traffic Gateway",
          status: "healthy",
          details: "Operational. Processing 1.2k secure req/s",
        },
        {
          name: "Platform Management Service",
          status: "healthy",
          details: "Core cluster responsive. Avg latency 42ms",
        },
        {
          name: "Video Processing Engine",
          status: "healthy",
          details: "Hardware-accelerated streaming active",
        },
      ],
      alerts: [],
    };

    const pdfBuffer = await reportGenerator.generate(mockData, "System Test (Mock Data)");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=StreamVision_TEST_Report.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    logger.error(`Failed to export TEST PDF report: ${error.message}`);
    res.status(500).send(`Test Engine Failure: ${error.message}`);
  }
};

/**
 * Monthly Report API (JSON)
 */
exports.getMonthlyReportApi = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || "now-30d";
    const reportData = await monitoringClient.asyncGetStructuredReport(timeframe);
    res.json(reportData);
  } catch (error) {
    logger.error(`API Report error: ${error.message}`);
    res.status(500).json({ error: "Failed to compile monitoring data" });
  }
};
