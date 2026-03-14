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
    if (msg.type === "STREAM_STARTED_RES") {
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

function getAllStreams() {
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
  const hlsUrl = `/hls/${streamId}/index.m3u8`;

  // Check if stream is already active
  if (activeStreams.has(streamId)) {
    return { hlsUrl, isNew: false };
  }

  const outputPath = path.join(streamDir, streamId);
  const playlistPath = path.join(outputPath, "index.m3u8");

  try {
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
    }
    fs.mkdirSync(outputPath, { recursive: true });
  } catch (err) {
    logger.error(`Error creating/clearing directories for stream ${streamId}:`, err);
    throw new Error("Failed to prepare stream directories");
  }

  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-rtsp_transport", "tcp",
      "-fflags", "nobuffer",
      "-flags", "low_delay",
      "-strict", "experimental",
      "-i", rtspUrl,
      "-c:v", "copy",
      "-preset", "ultrafast",
      "-tune", "zerolatency",
      "-f", "hls",
      "-hls_time", "1",
      "-hls_list_size", "2",
      "-hls_flags", "delete_segments+omit_endlist+discont_start",
      "-hls_segment_type", "mpegts",
      "-hls_segment_filename", `${outputPath}/segment_%03d.ts`,
      playlistPath,
    ],
    { stdio: "ignore" }
  );

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

  const fileExists = await waitForFile(playlistPath, 15000);
  if (fileExists) {
    resetStreamTimeout(streamId);
    return { hlsUrl, isNew: true };
  } else {
    throw new Error("FFmpeg failed to produce playlist in time");
  }
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
      logger.info(`Auto-stopping stream ${streamId} after ${STREAM_DURATION_LIMIT / 60000} minutes of inactivity`);
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
