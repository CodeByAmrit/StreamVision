require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const cookieParser = require("cookie-parser");
const favicon = require("serve-favicon");
const fs = require("fs");

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

const app = express();
const PORT = process.env.PORT || 5000;

// =================== Security & Middleware ===================

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Middleware to inject Recent Activities into every render
app.use(async (req, res, next) => {
  try {
    // Only fetch for pages that might render the navbar
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/public/dvr/')) {
       res.locals.recentActivities = await getRecentActivities(5);
    }
  } catch(err) {
    res.locals.recentActivities = [];
  }
  next();
});

const skipVideo = (req, res) => {
  return req.url.endsWith(".ts") || req.url.includes("/streams/");
};

app.use(
  morgan(
    (tokens, req, res) => {
      return JSON.stringify({
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        "response-time": tokens["response-time"](req, res, "ms"),
        "user-agent": tokens["user-agent"](req, res),
      });
    },
    {
      skip: skipVideo,
      stream: {
        write: (message) => {
          const data = JSON.parse(message);
          logger.info(`HTTP Request: ${data.method} ${data.url} - Status: ${data.status}`, data);
        },
      },
    }
  )
);

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'", "ws:", "wss:"],
        "script-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com", // <-- This line allows GSAP
          (req, res) => `'nonce-${res.locals.nonce}'`,
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
        ],
        "object-src": ["'self'"],
        "frame-src": ["'self'"],
        "connect-src": ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(favicon(path.join(__dirname, "public", "images", "fci.png")));
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hsts({ maxAge: 31536000 }));

app.use(
  cors({
    origin: ["https://cctvcameralive.in"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// =================== Static ===================
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
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

// =================== HLS Stream Serving ===================
const streamDir = path.join(__dirname, "streams");
if (!fs.existsSync(streamDir)) fs.mkdirSync(streamDir);

app.use(
  "/hls",
  express.static(streamDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      } else if (filePath.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/mp2t");
      }
    },
  })
);

// =================== Disable HLS Cache ===================
app.use(
  "/streams",
  (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  },
  express.static(path.join(__dirname, "public", "streams"))
);

// =================== Routes ===================
app.use("/", userRouter);
app.use("/camera", checkAuth, cameraRoutes);
app.use("/dvr", checkAuth, dvrRoutes);
app.use(settingsRoutes);
app.use(analyticsRoutes);
app.use(publicRoutes);
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

server.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
});
