require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const cameraRoutes = require('./routes/cameraRoutes');
const streamRoutes = require('./routes/streamRoutes');
const userRouter = require('./routes/userRouters');
const dvrRoutes = require('./routes/dvrs');
const publicRoute = require('./routes/publicRoutes');

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({ origin: '*' })); // Modify for security in production
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/flowbite", express.static(path.join(__dirname, "/node_modules/flowbite/dist")));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/streams', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, express.static(path.join(__dirname, 'public', 'streams')));

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
app.use('/', userRouter);
app.use('/camera', cameraRoutes);
app.use('/dvr', dvrRoutes);
app.use('/stream', streamRoutes);
app.use('/', publicRoute);

const PORT = process.env.PORT || 5000;

const { cleanupInactiveStreams } = require('./utils/streamManager');

// Run cleanup every 5 minutes
setInterval(() => {
    cleanupInactiveStreams(30 * 1000); // 5 minutes
}, 5 * 60 * 1000);

// Start the server
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
    
});
