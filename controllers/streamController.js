const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { readCameras } = require('./camerasController');

const hlsFolder = path.join(__dirname, '../hls');

// Ensure HLS folder exists
if (!fs.existsSync(hlsFolder)) {
    fs.mkdirSync(hlsFolder);
}

// Store active FFmpeg processes
const ffmpegProcesses = {};

// Start streaming
exports.startStream = (req, res) => {
    const cameras = readCameras();
    const cameraId = parseInt(req.params.id);
    const camera = cameras.find(c => c.id === cameraId);

    if (!camera) {
        return res.status(404).json({ error: 'Camera not found' });
    }

    const streamPath = path.join(hlsFolder, `camera${cameraId}.m3u8`);

    if (ffmpegProcesses[cameraId]) {
        return res.json({ streamUrl: `/hls/camera${cameraId}.m3u8` });
    }

    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',         // Use TCP for more stable streaming
        '-i', camera.url,                 // RTSP camera input
        '-fflags', 'nobuffer',            // Reduce buffer delay
        '-flags', 'low_delay',            // Enable low-latency mode
        '-strict', 'experimental',        // Allow experimental optimizations
        '-preset', 'ultrafast',           // Fastest encoding
        '-tune', 'zerolatency',           // Optimize for real-time
        '-c:v', 'libx264',                // Encode with H.264
        '-b:v', '1000k',                  // Bitrate (adjust if needed)
        '-g', '25',                        // GOP size (keyframe interval)
        '-sc_threshold', '0',             // Disable scene change detection
        '-bufsize', '500k',               // Reduce buffer size
        '-f', 'hls',                      // Output format: HLS
        '-hls_time', '1',                 // Segment duration (lower = lower latency)
        '-hls_list_size', '2',            // Keep only 2 segments
        '-hls_flags', 'delete_segments+append_list',  // Delete old segments to save space
        '-hls_allow_cache', '0',          // Disable caching to force real-time playback
        '-hls_start_number_source', 'epoch',  // Use absolute timestamps for sync
        streamPath
    ]);

    ffmpegProcesses[cameraId] = ffmpeg;

    ffmpeg.stderr.on('data', (data) => console.log(`FFmpeg [Camera ${cameraId}]: ${data}`));
    ffmpeg.on('exit', () => {
        console.log(`FFmpeg process for Camera ${cameraId} exited`);
        delete ffmpegProcesses[cameraId];
    });

    res.json({ streamUrl: `/hls/camera${cameraId}.m3u8` });
};

// Stop streaming
exports.stopStream = (req, res) => {
    const cameraId = parseInt(req.params.id);

    if (ffmpegProcesses[cameraId]) {
        ffmpegProcesses[cameraId].kill('SIGKILL');
        delete ffmpegProcesses[cameraId];
        res.json({ message: `Streaming for Camera ${cameraId} stopped` });
    } else {
        res.status(404).json({ error: 'No active stream for this camera' });
    }
};
