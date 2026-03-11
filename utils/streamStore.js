const crypto = require("crypto");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const STREAM_DURATION_LIMIT = 4 * 60 * 1000; // 4 minutes in milliseconds
const streamDir = path.join(__dirname, "..", "streams");

// In-memory store of active FFmpeg streams
// Map<streamId, { ffmpeg, rtspUrl, hlsUrl, startedAt, timeout, cameraId, dvrId }>
const activeStreams = new Map();

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

function startHlsStream(rtspUrl, cameraId, dvrId) {
  return new Promise((resolve, reject) => {
    if (!rtspUrl || !rtspUrl.startsWith("rtsp://")) {
      return reject(new Error("Invalid RTSP URL"));
    }

    const streamId = hashRtspUrl(rtspUrl);
    const hlsUrl = `/hls/${streamId}/index.m3u8`;

    // Check if stream is already active
    if (activeStreams.has(streamId)) {
      return resolve({ hlsUrl, isNew: false });
    }

    const outputPath = path.join(streamDir, streamId);
    const playlistPath = path.join(outputPath, "index.m3u8");

    try {
      if (!fs.existsSync(streamDir)) {
        fs.mkdirSync(streamDir, { recursive: true });
      }

      // CRITICAL: Clear older data if it exists to avoid stale footage
      if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
      }
      fs.mkdirSync(outputPath, { recursive: true });
    } catch (err) {
      logger.error(`Error creating/clearing directories for stream ${streamId}:`, err);
      return reject(new Error("Failed to prepare stream directories"));
    }

    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-rtsp_transport",
        "tcp",
        "-fflags",
        "nobuffer",
        "-flags",
        "low_delay",
        "-strict",
        "experimental",
        "-i",
        rtspUrl,
        "-c:v",
        "copy",
        "-preset",
        "ultrafast",
        "-tune",
        "zerolatency",
        "-f",
        "hls",
        "-hls_time",
        "1",
        "-hls_list_size",
        "2",
        "-hls_flags",
        "delete_segments+omit_endlist+discont_start",
        "-hls_segment_type",
        "mpegts",
        `-hls_segment_filename`,
        `${outputPath}/segment_%03d.ts`,
        playlistPath,
      ],
      {
        stdio: "ignore",
      }
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
      timeout: null, // Initialized via resetStreamTimeout
    });

    // Wait for the playlist to actually be created by FFmpeg before responding
    waitForFile(playlistPath, 15000).then(() => {
      // Initialize the timeout upon start
      resetStreamTimeout(streamId);
      resolve({ hlsUrl, isNew: true });
    });
  });
}

function resetStreamTimeout(streamId) {
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
};
