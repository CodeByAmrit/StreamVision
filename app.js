require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const status = require('express-status-monitor');
const fs = require('fs');
const { spawn } = require('child_process');

// Local services and routes
const checkAuth = require('./services/checkauth');
const cameraRoutes = require('./routes/cameraRoutes');
const cameraRoute = require('./routes/camera');
const userRouter = require('./routes/userRouters');
const dvrRoutes = require('./routes/dvrs');
const publicRoute = require('./routes/publicRoutes');
const { cleanupInactiveStreams } = require('./utils/streamManager');

const app = express();
const PORT = process.env.PORT || 5000;

// =================== Security & Middleware ===================
app.use(status());

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        (req, res) => `'nonce-${res.locals.nonce}'`
      ],
      "worker-src": ["'self'", "blob:"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "media-src": ["'self'", "blob:"],
      "img-src": ["'self'", "data:", "blob:", "https://avatars.githubusercontent.com"],
      "object-src": ["'self'"],
      "frame-src": ["'self'"],
      "connect-src": ["'self'"],
    }
  },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' }
}));

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hsts({ maxAge: 31536000 }));

app.use(cors({
  origin: ['https://cctvcameralive.in'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// =================== Static ===================
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));
app.use('/flowbite', express.static(path.join(__dirname, 'node_modules/flowbite/dist')));

// =================== View Engine ===================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =================== HLS Stream Serving ===================
const streamDir = path.join(__dirname, 'streams');
if (!fs.existsSync(streamDir)) fs.mkdirSync(streamDir);

app.use('/hls', express.static(streamDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    }
  }
}));

// =================== Disable HLS Cache ===================
app.use('/streams', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}, express.static(path.join(__dirname, 'public', 'streams')));

// =================== Routes ===================
app.use('/', userRouter);
app.use('/camera', checkAuth, cameraRoutes);
app.use('/dvr', checkAuth, dvrRoutes);
app.use('/', publicRoute);
app.use('/camera/view', cameraRoute);

// =================== HLS Streaming Endpoint for Extension ===================
const activeStreams = {};

function hashRtspUrl(rtspUrl) {
  return crypto.createHash('md5').update(rtspUrl).digest('hex');
}

const STREAM_DURATION_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds

app.post('/api/start-stream', (req, res) => {
  const { rtspUrl } = req.body;

  if (!rtspUrl || !rtspUrl.startsWith('rtsp://')) {
    return res.status(400).json({ error: 'Invalid RTSP URL' });
  }

  const streamId = hashRtspUrl(rtspUrl);
  const outputPath = path.join(streamDir, streamId);
  const playlistPath = path.join(outputPath, 'index.m3u8');
  const hlsUrl = `/hls/${streamId}/index.m3u8`;

  if (activeStreams[streamId]) {
    return res.json({ hlsUrl });
  }

  fs.mkdirSync(outputPath, { recursive: true });

  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-fflags', 'nobuffer',
    '-flags', 'low_delay',
    '-strict', 'experimental',
    '-i', rtspUrl,
    '-c:v', 'copy',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-f', 'hls',
    '-hls_time', '1',
    '-hls_list_size', '2',
    '-hls_flags', 'delete_segments+omit_endlist+discont_start',
    '-hls_segment_type', 'mpegts',
    `-hls_segment_filename`, `${outputPath}/segment_%03d.ts`,
    playlistPath
  ], {
    stdio: 'ignore'
  });

  ffmpeg.on('error', (err) => {
    console.error(`[FFmpeg Error]:`, err);
    return res.status(500).json({ error: 'Failed to start stream' });
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg stream for ${rtspUrl} exited with code ${code}`);
    delete activeStreams[streamId];
    fs.rmSync(outputPath, { recursive: true, force: true });
  });

  // Auto stop stream after 10 minutes
  const timeout = setTimeout(() => {
    console.log(`Auto-stopping stream ${streamId} after 10 minutes`);
    ffmpeg.kill('SIGINT');
  }, STREAM_DURATION_LIMIT);

  activeStreams[streamId] = {
    ffmpeg,
    rtspUrl,
    hlsUrl,
    startedAt: new Date(),
    timeout // store timeout in case you want to cancel it later
  };

  res.json({ hlsUrl });
});

app.post('/api/stop-stream', (req, res) => {
  const { rtspUrl } = req.body;
  const streamId = hashRtspUrl(rtspUrl);

  const stream = activeStreams[streamId];
  if (stream) {
    stream.ffmpeg.kill('SIGINT');
    clearTimeout(stream.timeout);
    return res.json({ message: 'Stream stopped manually' });
  }

  res.status(404).json({ error: 'Stream not found' });
});


// Debug: List active streams
app.get('/debug/streams', (req, res) => {
  res.json(
    Object.fromEntries(
      Object.entries(activeStreams).map(([id, stream]) => [
        id,
        {
          rtspUrl: stream.rtspUrl,
          startedAt: stream.startedAt,
        }
      ])
    )
  );
});

// Periodic Cleanup (if needed, extend later)
setInterval(() => cleanupInactiveStreams(5 * 60 * 1000), 5 * 60 * 1000);

// clear old streams on startup
if (fs.existsSync("./streams")) {
  fs.rmSync("./streams", { recursive: true, force: true });
}

// =================== Start Server ===================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
