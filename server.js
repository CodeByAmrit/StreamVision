const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' })); // Allow all origins (Modify for security)
app.use(express.json());
app.use(express.static(__dirname + '/public'));

const camerasFile = path.join(__dirname, 'cameras.json');
if (!fs.existsSync(camerasFile)) fs.writeFileSync(camerasFile, JSON.stringify([]));

const getCameras = () => JSON.parse(fs.readFileSync(camerasFile));
const saveCameras = (cameras) => fs.writeFileSync(camerasFile, JSON.stringify(cameras, null, 2));

const hlsFolder = path.join(__dirname, 'hls');
if (!fs.existsSync(hlsFolder)) fs.mkdirSync(hlsFolder);

app.use('/hls', express.static(hlsFolder, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.m3u8')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else if (filePath.endsWith('.ts')) {
            res.setHeader('Content-Type', 'video/mp2t');
        }
    }
}));

const ffmpegProcesses = {};

app.get('/cameras', (req, res) => {
    res.json(getCameras());
});

app.post('/cameras', (req, res) => {
    const cameras = getCameras();
    const newId = cameras.length ? Math.max(...cameras.map(c => c.id)) + 1 : 1; // Ensure unique ID
    const newCamera = { id: newId, ...req.body };
    cameras.push(newCamera);
    saveCameras(cameras);
    res.json(newCamera);
});

app.delete('/cameras/:id', (req, res) => {
    const cameraId = parseInt(req.params.id);
    let cameras = getCameras();
    cameras = cameras.filter(c => c.id !== cameraId);
    saveCameras(cameras);

    if (ffmpegProcesses[cameraId]) {
        ffmpegProcesses[cameraId].kill('SIGKILL');
        delete ffmpegProcesses[cameraId];
    }

    res.json({ message: `Camera ${cameraId} deleted` });
});

app.get('/stream/:id', (req, res) => {
    const cameras = getCameras();
    const cameraId = parseInt(req.params.id);
    const camera = cameras.find(c => c.id === cameraId);

    if (!camera) return res.status(404).json({ error: 'Camera not found' });

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
});

app.get('/stop/:id', (req, res) => {
    const cameraId = parseInt(req.params.id);
    if (ffmpegProcesses[cameraId]) {
        ffmpegProcesses[cameraId].kill('SIGKILL');
        delete ffmpegProcesses[cameraId];
        res.json({ message: `Streaming for Camera ${cameraId} stopped` });
    } else {
        res.status(404).json({ error: 'No active stream for this camera' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
