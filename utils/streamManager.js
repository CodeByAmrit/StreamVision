const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');

const activeStreams = {}; // cameraId -> { worker, lastAccess, outputPath }

/**
 * Starts a new stream using a worker thread.
 * @param {string} cameraId - Unique identifier for the stream (e.g., DVR_camera format).
 * @param {string} rtspUrl - RTSP stream source URL.
 * @param {string} outputPath - Local HLS output path.
 */
function startStream(cameraId, rtspUrl, outputPath, camera_details) {
    if (activeStreams[cameraId]) return;

    const worker = new Worker(path.join(__dirname, 'streamWorker.js'), {
        workerData: { cameraId, rtspUrl, outputPath }
    });

    activeStreams[cameraId] = {
        worker,
        lastAccess: Date.now(),
        outputPath,
        camera_details
    };

    worker.on('message', msg => {
        if (msg.type === 'log') {
            console.log(`[FFmpeg:${cameraId}] ${msg.data}`);
        }
    });

    worker.on('exit', code => {
        console.log(`🛑 FFmpeg worker for ${cameraId} exited (code: ${code})`);
        delete activeStreams[cameraId];
    });
}

/**
 * Updates the last access time of a stream.
 * @param {string} cameraId
 */
function updateLastAccess(cameraId) {
    if (activeStreams[cameraId]) {
        activeStreams[cameraId].lastAccess = Date.now();
    }
}

/**
 * Stops a running stream and cleans up the output.
 * @param {string} cameraId
 */
function stopStream(cameraId) {
    const stream = activeStreams[cameraId];
    if (!stream) return;

    stream.worker.terminate();
    delete activeStreams[cameraId];

    if (stream.outputPath && fs.existsSync(stream.outputPath)) {
        fs.rmSync(stream.outputPath, { recursive: true, force: true });
        console.log(`🧹 Cleaned up output path for ${cameraId}`);
    }
}

/**
 * Checks if a stream is currently active.
 * @param {string} cameraId
 * @returns {boolean}
 */
function isStreamActive(cameraId) {
    return !!activeStreams[cameraId];
}

/**
 * Stops all active streams.
 */
function stopAll() {
    Object.keys(activeStreams).forEach(stopStream);
}

/**
 * Cleans up inactive streams based on a timeout.
 * @param {number} timeoutMs - Inactivity threshold in milliseconds.
 */
function cleanupInactiveStreams(timeoutMs = 5 * 60 * 1000) {
    const now = Date.now();
    for (const [cameraId, stream] of Object.entries(activeStreams)) {
        if (now - stream.lastAccess > timeoutMs) {
            console.log(`⏹ Stopping inactive stream: ${cameraId}`);
            stopStream(cameraId);
        }
    }
}

module.exports = {
    startStream,
    stopStream,
    stopAll,
    cleanupInactiveStreams,
    updateLastAccess,
    isStreamActive,
    activeStreams
};
