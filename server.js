const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));  // Allow all domains
app.use(express.json());
app.use(express.static(__dirname + '/public'));

const camerasFile = path.join(__dirname, 'cameras.json');
if (!fs.existsSync(camerasFile)) fs.writeFileSync(camerasFile, JSON.stringify([]));

const getCameras = () => JSON.parse(fs.readFileSync(camerasFile));
const saveCameras = (cameras) => fs.writeFileSync(camerasFile, JSON.stringify(cameras, null, 2));

const hlsFolder = path.join(__dirname, 'hls');
if (!fs.existsSync(hlsFolder)) fs.mkdirSync(hlsFolder);

app.use('/hls', express.static(hlsFolder, {
    setHeaders: (res, path) => {
        if (path.endsWith('.m3u8')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else if (path.endsWith('.ts')) {
            res.setHeader('Content-Type', 'video/mp2t');
        }
    }
}));

app.get('/cameras', (req, res) => {
    res.json(getCameras());
});

app.post('/cameras', (req, res) => {
    const cameras = getCameras();
    const newCamera = { id: cameras.length + 1, ...req.body };
    cameras.push(newCamera);
    saveCameras(cameras);
    res.json(newCamera);
});

app.delete('/cameras/:id', (req, res) => {
    let cameras = getCameras();
    cameras = cameras.filter(c => c.id != req.params.id);
    saveCameras(cameras);
    res.json({ message: 'Camera deleted' });
});

const ffmpegProcesses = {};

app.get('/stream/:id', (req, res) => {
    const cameras = getCameras();
    const camera = cameras.find(c => c.id == req.params.id);
    if (!camera) return res.status(404).send('Camera not found');

    const streamPath = path.join(hlsFolder, `camera${camera.id}.m3u8`);

    if (ffmpegProcesses[camera.id]) {
        return res.json({ streamUrl: `/hls/camera${camera.id}.m3u8` });
    }

    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-i', camera.url,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '5',
        '-hls_flags', 'delete_segments',
        streamPath
    ]);

    ffmpegProcesses[camera.id] = ffmpeg;

    ffmpeg.stderr.on('data', (data) => console.log(`FFmpeg [Camera ${camera.id}]: ${data}`));
    ffmpeg.on('close', () => {
        console.log(`FFmpeg process for Camera ${camera.id} stopped`);
        delete ffmpegProcesses[camera.id];
    });

    res.json({ streamUrl: `/hls/camera${camera.id}.m3u8` });
});

app.get('/stop/:id', (req, res) => {
    const cameraId = req.params.id;
    if (ffmpegProcesses[cameraId]) {
        ffmpegProcesses[cameraId].kill('SIGINT');
        res.json({ message: `Streaming for Camera ${cameraId} stopped` });
    } else {
        res.status(404).json({ message: 'No active stream found for this camera' });
    }
});

app.listen(5000, () => console.log(`Server running on http://localhost:${5000}`));
