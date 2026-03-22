const crypto = require("crypto");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const cluster = require("cluster");
const logger = require("./logger");

const STREAM_DURATION_LIMIT = 4 * 60 * 1000; // 4 minutes in milliseconds
const streamDir = path.join(__dirname, "..", "streams");

// In-memory store of active FFmpeg streams (Only populated in Primary/Master process)
const activeStreams = new Map();

// Pending requests in Worker processes
const pendingRequests = new Map();

if (cluster.isWorker) {
  process.on("message", (msg) => {
    if (msg.type === "STREAM_STARTED_RES" || msg.type === "GET_ALL_STREAMS_RES") {
      const pending = pendingRequests.get(msg.msgId);
      if (pending) {
        pendingRequests.delete(msg.msgId);
        if (msg.error) pending.reject(new Error(msg.error));
        else pending.resolve(msg.result);
      }
    }
  });
}

/**
 * Setup IPC handlers for the Primary (Master) process.
 * Should be called once in cluster.js if cluster.isMaster.
 */
function setupPrimaryHandlers(worker) {
  worker.on("message", async (msg) => {
    try {
      if (msg.type === "START_STREAM_REQ") {
        const result = await startHlsStream(msg.rtspUrl, msg.cameraId, msg.dvrId);
        worker.send({ type: "STREAM_STARTED_RES", msgId: msg.msgId, result });
      } else if (msg.type === "GET_ALL_STREAMS_REQ") {
        const streamArray = Array.from(activeStreams.values()).map((s) => ({
          rtspUrl: s.rtspUrl,
          hlsUrl: s.hlsUrl,
          cameraId: s.cameraId,
          dvrId: s.dvrId,
          startedAt: s.startedAt,
        }));
        worker.send({ type: "GET_ALL_STREAMS_RES", msgId: msg.msgId, result: streamArray });
      } else if (msg.type === "RESET_TIMEOUT_REQ") {
        resetStreamTimeout(msg.streamId);
      } else if (msg.type === "STOP_STREAM_REQ") {
        stopHlsStream(msg.rtspUrl);
      }
    } catch (err) {
      if (msg.msgId) {
        worker.send({ type: "STREAM_STARTED_RES", msgId: msg.msgId, error: err.message });
      }
    }
  });
}

function hashRtspUrl(rtspUrl) {
  return crypto.createHash("md5").update(rtspUrl).digest("hex");
}

function waitForFile(filePath, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        logger.warn(`Timeout waiting for file: ${filePath}`);
        resolve(false);
      }
    }, 500); // Check every 500ms
  });
}

function getStreamById(rtspUrl) {
  const streamId = hashRtspUrl(rtspUrl);
  return activeStreams.get(streamId);
}

async function getAllStreams() {
  if (cluster.isWorker) {
    return new Promise((resolve) => {
      const msgId = crypto.randomUUID();
      // On error/rejection, we just return empty array so UI doesn't crash
      pendingRequests.set(msgId, { resolve, reject: resolve });
      process.send({ type: "GET_ALL_STREAMS_REQ", msgId });

      // Auto-resolve empty if master hangs
      setTimeout(() => {
        if (pendingRequests.has(msgId)) {
          pendingRequests.delete(msgId);
          resolve([]);
        }
      }, 2000);
    });
  }
  return Array.from(activeStreams.values());
}

async function startHlsStream(rtspUrl, cameraId, dvrId) {
  if (cluster.isWorker) {
    return new Promise((resolve, reject) => {
      const msgId = crypto.randomUUID();
      pendingRequests.set(msgId, { resolve, reject });
      process.send({ type: "START_STREAM_REQ", rtspUrl, cameraId, dvrId, msgId });
    });
  }

  if (!rtspUrl || !rtspUrl.startsWith("rtsp://")) {
    throw new Error("Invalid RTSP URL");
  }

  const streamId = hashRtspUrl(rtspUrl);

  // Check if stream is already active
  if (activeStreams.has(streamId)) {
    return { hlsUrl: activeStreams.get(streamId).hlsUrl, isNew: false };
  }

  const sessionTimestamp = Date.now();
  const outputPath = path.join(streamDir, streamId, String(sessionTimestamp));
  const hlsUrl = `/hls/${streamId}/${sessionTimestamp}/index.m3u8`;
  const playlistPath = path.join(outputPath, "index.m3u8");

  try {
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    // Ensure parent streamId directory exists
    const parentPath = path.join(streamDir, streamId);
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath, { recursive: true });
    }

    // Create session-specific output directory
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
    }
    fs.mkdirSync(outputPath, { recursive: true });
  } catch (err) {
    logger.error(`Error creating/clearing directories for stream ${streamId}:`, err);
    throw new Error("Failed to prepare stream directories");
  }

  const ffmpeg = spawn("ffmpeg", [
    "-rtsp_transport",
    "tcp",
    "-probesize",
    "8192",
    "-analyzeduration",
    "1000000",
    "-fflags",
    "nobuffer+flush_packets",
    "-flags",
    "low_delay",
    "-use_wallclock_as_timestamps",
    "1",
    "-i",
    rtspUrl,
    "-c:v",
    "copy",
    "-vsync",
    "passthrough",
    "-f",
    "hls",
    "-hls_time",
    "2",
    "-hls_list_size",
    "3",
    "-hls_flags",
    "delete_segments+append_list+omit_endlist+program_date_time",
    "-hls_segment_type",
    "mpegts",
    "-hls_segment_filename",
    `${outputPath}/segment_%03d.ts`,
    playlistPath,
  ]);

  ffmpeg.on("error", (err) => {
    logger.error(`[FFmpeg Error]: ${err.message}`);
  });

  ffmpeg.on("close", (code) => {
    logger.info(`FFmpeg stream for ${rtspUrl} exited with code ${code}`);
    activeStreams.delete(streamId);
    try {
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
      }
      // Cleanup parent directory if empty
      const parentPath = path.join(streamDir, streamId);
      if (fs.existsSync(parentPath) && fs.readdirSync(parentPath).length === 0) {
        fs.rmdirSync(parentPath);
      }
    } catch (e) {
      logger.error(`Failed to cleanup stream output directory ${outputPath}:`, e);
    }
  });

  activeStreams.set(streamId, {
    ffmpeg,
    rtspUrl,
    hlsUrl,
    cameraId,
    dvrId,
    startedAt: new Date(),
    timeout: null,
  });

  resetStreamTimeout(streamId);
  return { hlsUrl, isNew: true };
}

function resetStreamTimeout(streamId) {
  if (cluster.isWorker) {
    process.send({ type: "RESET_TIMEOUT_REQ", streamId });
    return true;
  }

  const stream = activeStreams.get(streamId);
  if (stream) {
    if (stream.timeout) {
      clearTimeout(stream.timeout);
    }

    stream.timeout = setTimeout(() => {
      logger.info(
        `Auto-stopping stream ${streamId} after ${STREAM_DURATION_LIMIT / 60000} minutes of inactivity`
      );
      stream.ffmpeg.kill("SIGINT");
    }, STREAM_DURATION_LIMIT);

    return true;
  }
  return false;
}

function stopHlsStream(rtspUrl) {
  if (cluster.isWorker) {
    process.send({ type: "STOP_STREAM_REQ", rtspUrl });
    return true;
  }

  const streamId = hashRtspUrl(rtspUrl);
  const stream = activeStreams.get(streamId);

  if (stream) {
    stream.ffmpeg.kill("SIGINT");
    clearTimeout(stream.timeout);
    return true;
  }
  return false;
}

function cleanupAll() {
  if (cluster.isWorker) return; // Only master cleans up global processes

  logger.info("Cleaning up all active streams and removing streams directory...");
  for (const [streamId, stream] of activeStreams) {
    logger.info(`Stopping stream ${streamId}`);
    stream.ffmpeg.kill("SIGINT");
    clearTimeout(stream.timeout);
  }
  activeStreams.clear();

  try {
    if (fs.existsSync(streamDir)) {
      fs.rmSync(streamDir, { recursive: true, force: true });
      logger.info("Streams directory deleted successfully.");
    }
  } catch (err) {
    logger.error("Error during global streams cleanup:", err);
  }
}

module.exports = {
  getStreamById,
  getAllStreams,
  startHlsStream,
  stopHlsStream,
  cleanupAll,
  resetStreamTimeout,
  hashRtspUrl,
  setupPrimaryHandlers,
};
