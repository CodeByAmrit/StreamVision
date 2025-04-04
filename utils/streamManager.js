const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');

const activeStreams = {};  // cameraId -> { worker, lastAccess }

function startStream(cameraId, rtspUrl, outputPath) {
    if (activeStreams[cameraId]) return;

    const worker = new Worker(path.join(__dirname, 'streamWorker.js'), {
        workerData: { cameraId, rtspUrl, outputPath }
    });

    activeStreams[cameraId] = {
        worker,
        lastAccess: Date.now(),
        outputPath
    };

    worker.on('message', (msg) => {
        if (msg.type === 'log') console.log(`[FFmpeg:${cameraId}]`, msg.data);
    });

    worker.on('exit', (code) => {
        console.log(`FFmpeg worker for camera ${cameraId} exited`);
        delete activeStreams[cameraId];
    });
}

function updateLastAccess(cameraId) {
    if (activeStreams[cameraId]) {
        activeStreams[cameraId].lastAccess = Date.now();
    }
}

function stopStream(cameraId) {
    const stream = activeStreams[cameraId];
    if (stream) {
        stream.worker.terminate();
        delete activeStreams[cameraId];

        // Optionally remove old files
        if (stream.outputPath && fs.existsSync(stream.outputPath)) {
            fs.rmSync(stream.outputPath, { recursive: true, force: true });
        }
    }
}

function cleanupInactiveStreams(timeoutMs = 5 * 60 * 1000) {
    const now = Date.now();
    for (const [cameraId, stream] of Object.entries(activeStreams)) {
        if (now - stream.lastAccess > timeoutMs) {
            console.log(`⏹️ Stopping inactive stream: ${cameraId}`);
            stopStream(cameraId);
        }
    }
}

function stopAll() {
    Object.keys(activeStreams).forEach(stopStream);
}

module.exports = { startStream, stopStream, stopAll, cleanupInactiveStreams, updateLastAccess, activeStreams };
