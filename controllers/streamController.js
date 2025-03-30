const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { readCameras } = require('./cameraController');

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
        '-rtsp_transport', 'tcp',
        '-i', camera.url,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '3',
        '-hls_flags', 'delete_segments',
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
