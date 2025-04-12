require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const status = require('express-status-monitor');

const checkAuth = require('./services/checkauth');
const cameraRoutes = require('./routes/cameraRoutes');
const userRouter = require('./routes/userRouters');
const dvrRoutes = require('./routes/dvrs');
const publicRoute = require('./routes/publicRoutes');

const { cleanupInactiveStreams } = require('./utils/streamManager');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(status());

// === Nonce middleware for CSP ===
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});
// Security Headers
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
      "img-src": ["'self'", "data:", "blob:"],
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

// CORS
app.use(cors({
  origin: ['https://cctvcameralive.in'], // Replace with your production domain(s)
  credentials: true
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static Assets
// Serve static files and fix SVG content type if needed
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));
app.use('/flowbite', express.static(path.join(__dirname, 'node_modules/flowbite/dist')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Disable caching for HLS stream files
app.use('/streams', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}, express.static(path.join(__dirname, 'public', 'streams')));

// HLS Stream Headers
app.use('/hls', express.static(path.join(__dirname, 'hls'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    }
  }
}));

// Routes
app.use('/', userRouter);
app.use('/camera', checkAuth, cameraRoutes);
app.use('/dvr', checkAuth, dvrRoutes);
app.use('/', publicRoute);

// Cleanup inactive streams every 5 minutes
setInterval(() => cleanupInactiveStreams(5 * 60 * 1000), 5 * 60 * 1000);

app.get('/debug/streams', (req, res) => {
  const activeStreams = require('./utils/streamManager').activeStreams;
  res.json(
    Object.fromEntries(
      Object.entries(activeStreams).map(([id, stream]) => [
        id,
        {
          lastAccessAgo: (Date.now() - stream.lastAccess) + ' ms',
        }
      ])
    )
  );
});


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
