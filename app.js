require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const favicon = require("serve-favicon");
const fs = require("fs");
const { doubleCsrf } = require("csrf-csrf");

const http = require("http");

// Local services and routes
const checkAuth = require("./services/checkauth");
const cameraRoutes = require("./routes/cameraRoutes");
const userRouter = require("./routes/userRouters");
const dvrRoutes = require("./routes/dvrs");
const settingsRoutes = require("./routes/settingsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const publicRoutes = require("./routes/publicRoutes");
const streamStore = require("./utils/streamStore");
const { getRecentActivities } = require("./utils/activityLogger");
const logger = require("./utils/logger");
const morgan = require("morgan");
const { apiLimiter, authLimiter } = require("./middleware/security");

const pkg = require("./package.json");
const app = express();
const PORT = process.env.PORT || 5000;

// Trust Proxy: Essential for AWS Load Balancers and Cloudflare
// Ensures req.ip, rate limiting, and audit logs use the real client IP
app.set("trust proxy", true);

// Global App Version (Injected via Docker Build ARG / System Env or package.json)
app.locals.appVersion = process.env.APP_VERSION || `v${pkg.version}`;

// =================== Security & Middleware ===================

// Disable ETag to reduce server overhead
app.set("etag", false);

// Global connection optimization
app.use((req, res, next) => {
  res.setHeader("Connection", "keep-alive");
  next();
});

// =================== Global Performance & Security ===================
app.use(compression()); // Compress all responses

// Optimize nonce generation: Only for HTML/EJS requests to reduce crypto overhead
app.use((req, res, next) => {
  const isHtml = req.accepts("html");
  if (isHtml) {
    res.locals.nonce = crypto.randomBytes(16).toString("base64");
  } else {
    res.locals.nonce = "";
  }
  next();
});

// Apply general API rate limiting (Exempting public API endpoints)
app.use("/api/", (req, res, next) => {
  // Check against originalUrl to be absolutely sure
  if (req.originalUrl.includes("/api/public/")) {
    return next();
  }
  apiLimiter(req, res, next);
});

// Middleware to inject Recent Activities into every render with simple caching
let cachedActivities = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

app.use(async (req, res, next) => {
  try {
    // Only fetch for pages that might render the navbar
    if (
      req.method === "GET" &&
      !req.path.startsWith("/api/") &&
      !req.path.startsWith("/public/dvr/")
    ) {
      const now = Date.now();
      if (!cachedActivities || now - lastFetchTime > CACHE_DURATION) {
        cachedActivities = await getRecentActivities(10);
        lastFetchTime = now;
      }
      res.locals.recentActivities = cachedActivities;
    }
  } catch (err) {
    res.locals.recentActivities = [];
  }
  next();
});

const skipVideo = (req, res) => {
  // Skip video chunks and streaming manifests to prevent log spam
  return (
    req.url.includes(".ts") ||
    req.url.includes(".m3u8") ||
    req.url.includes("/hls/") ||
    req.url.includes("/streams/")
  );
};

app.use(
  morgan(
    process.env.NODE_ENV === "production" ? "tiny" : "dev", // Use faster 'tiny' in prod
    {
      skip: skipVideo,
      stream: {
        write: (message) => {
          // Log to winston only if it's not a generic asset or use a faster logger format
          logger.info(message.trim());
        },
      },
    }
  )
);

app.disable("x-powered-by");

// Consolidated Helmet Configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'", "ws:", "wss:"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://cloud.umami.is",
          "https://cctvweblink.in",
          "https://ajax.cloudflare.com",
        ],
        "worker-src": ["'self'", "blob:"],
        "style-src": [
          "'self'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "'unsafe-inline'",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        "media-src": ["'self'", "blob:"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://avatars.githubusercontent.com",
          "https://images.unsplash.com",
          "https://ui-avatars.com",
        ],
        "object-src": ["'self'"],
        "frame-src": ["'self'", "https://docs.google.com"],
        "connect-src": [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://cloud.umami.is",
          "https://api-gateway.umami.dev",
          "https://cctvweblink.in",
          "https://ajax.cloudflare.com",
        ],
        "form-action": ["'self'", "https://docs.google.com"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    xssFilter: true,
    noSniff: true,
    hsts: { maxAge: 31536000 },
  })
);

app.use(favicon(path.join(__dirname, "public", "images", "fci.png")));

app.use(
  cors({
    origin: ["https://cctvweblink.in"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// CSRF Protection Initialization
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.jwt_token || "super-secret-key",
  getSessionIdentifier: (req) => req.cookies.token || "guest-session", // Bind token to JWT cookie
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  getTokenFromRequest: (req) => req.headers["x-csrf-token"] || req.body?._csrf,
});

// Allow Cloudflare and browsers to cache static assets aggressively (30 days)
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "30d",
    immutable: true,
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      if (filePath.endsWith(".svg")) {
        res.setHeader("Content-Type", "image/svg+xml");
      }
    },
  })
);
app.use("/flowbite", express.static(path.join(__dirname, "node_modules/flowbite/dist")));

// =================== View Engine ===================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Enable view caching in production to improve RPS
if (process.env.NODE_ENV === "production") {
  app.set("view cache", true);
}

// =================== HLS Stream Serving ===================
const streamDir = path.join(__dirname, "streams");
if (!fs.existsSync(streamDir)) fs.mkdirSync(streamDir, { recursive: true });

// Heartbeat Middleware: Every request to /hls resets the 4-minute timeout for that stream
app.use("/hls", (req, res, next) => {
  const parts = req.path.split("/").filter(Boolean);
  if (parts.length > 0) {
    const streamId = parts[0];
    streamStore.resetStreamTimeout(streamId);
  }
  next();
});

app.use(
  "/hls",
  express.static(streamDir, {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (filePath.endsWith(".m3u8")) {
        res.setHeader(
          "Cache-Control",
          "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      } else if (filePath.endsWith(".ts")) {
        // Segments are now unique per session, but we still disable cache just in case
        res.setHeader(
          "Cache-Control",
          "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Content-Type", "video/mp2t");
      }
    },
  })
);

// =================== Optimal HLS Caching strategy ===================
app.use(
  "/streams",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.path.endsWith(".m3u8")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    } else if (req.path.endsWith(".ts")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  },
  express.static(path.join(__dirname, "public", "streams"), {
    etag: false,
    lastModified: false,
  })
);

// 1. Public Routes (No Auth, No strict Rate Limiting)
app.use(publicRoutes);

// 2. Specific Security Middleware for Admin/API
app.use("/", (req, res, next) => {
  // Skip CSRF for purely public streaming APIs if they are GET only
  if (req.path.startsWith("/api/public") && req.method === "GET") {
    return next();
  }
  // Skip CSRF for public preview APIs on the index page
  if (req.path === "/api/start-stream" || req.path === "/api/stop-stream") {
    return next();
  }
  // Skip CSRF for public DVR pages
  if (req.path.startsWith("/public/")) {
    return next();
  }
  doubleCsrfProtection(req, res, next);
});

// Middleware to inject CSRF token into all views
app.use((req, res, next) => {
  res.locals.csrfToken = generateCsrfToken(req, res);
  next();
});

// 3. Admin/Protected Routes
// Note: Sensitive rate limiting is now applied inside userRouter specifically for login/password
app.use("/", userRouter);
app.use("/camera", checkAuth, cameraRoutes);
app.use("/dvr", checkAuth, dvrRoutes);
app.use(settingsRoutes);
app.use(analyticsRoutes);
// =================== API Endpoints ===================

app.post("/api/start-stream", async (req, res) => {
  const { rtspUrl } = req.body;

  if (!rtspUrl || !rtspUrl.startsWith("rtsp://")) {
    return res.status(400).json({ error: "Invalid RTSP URL" });
  }

  try {
    const result = await streamStore.startHlsStream(rtspUrl, null, null);
    res.json({ hlsUrl: result.hlsUrl });
  } catch (err) {
    logger.error("Error triggering stream via API:", err);
    res.status(500).json({ error: "Failed to start stream" });
  }
});

app.post("/api/stop-stream", (req, res) => {
  const { rtspUrl } = req.body;
  if (!rtspUrl) return res.status(400).json({ error: "Missing RTSP URL" });

  const stopped = streamStore.stopHlsStream(rtspUrl);
  if (stopped) {
    return res.json({ message: "Stream stopped manually" });
  }

  res.status(404).json({ error: "Stream not found" });
});

app.get("/api/public/camera/:id/hls", async (req, res) => {
  try {
    const cameraId = req.params.id;
    if (!/^\d+$/.test(cameraId)) {
      return res.status(400).json({ error: "Invalid camera ID" });
    }

    const [rows] = await require("./config/db").execute(
      `SELECT rtsp_url, dvr_id FROM cameras WHERE id = ? AND enabled = 1`,
      [cameraId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Camera not found or disabled" });
    }

    const rtspUrl = rows[0].rtsp_url;
    if (!rtspUrl || !rtspUrl.startsWith("rtsp://")) {
      return res.status(400).json({ error: "Invalid RTSP URL configured for this camera" });
    }

    const { hlsUrl } = await streamStore.startHlsStream(rtspUrl, cameraId, rows[0].dvr_id);
    res.json({ hlsUrl });
  } catch (err) {
    logger.error("Error in public HLS endpoint:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =================== Start Server ===================
const server = http.createServer(app);

// Global cleanup of potentially stale streams from previous crash/run
streamStore.cleanupAll();

// Performance Tuning: Keep-Alive
// Set timeout higher than proxy (Cloudflare/Traefik) to reuse connections efficiently
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
});

// =================== Graceful Shutdown ===================
const gracefulShutdown = () => {
  logger.info("Termination signal received. Shutting down gracefully...");
  streamStore.cleanupAll();
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });

  // Force exit if server doesn't close in 5 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 5000);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
