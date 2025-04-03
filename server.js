require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const cameraRoutes = require('./routes/cameraRoutes');
const streamRoutes = require('./routes/streamRoutes');
const userRouter = require('./routes/userRouters');

const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Modify for security in production
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/flowbite", express.static(path.join(__dirname, "/node_modules/flowbite/dist")));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve HLS video files with correct headers
const hlsFolder = path.join(__dirname, 'hls');
app.use('/hls', express.static(hlsFolder, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.m3u8')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else if (filePath.endsWith('.ts')) {
            res.setHeader('Content-Type', 'video/mp2t');
        }
    }
}));

// Routes
app.get('/', (req, res) => res.render('index', { title: 'RTSP Streamer' }));
// app.use('/', userRouter);
app.use('/cameras', cameraRoutes);
app.use('/stream', streamRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
