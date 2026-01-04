const { spawn } = require("child_process");

class StreamInstance {
  constructor(cameraId, rtspUrl) {
    this.cameraId = cameraId;
    this.rtspUrl = rtspUrl;

    this.clients = new Set();
    this.ffmpeg = null;

    // ===== LIVE METADATA =====
    this.meta = {
      startedAt: null,
      resolution: null,
      fps: null,
      codec: null,
      bitrateKbps: null,
      lastFrameAt: null,
      frames: 0,
      bytes: 0,
    };
  }

  start() {
    if (this.ffmpeg) return;

    console.log(`▶ Starting camera ${this.cameraId}`);

    this.meta.startedAt = Date.now();
    this.meta.frames = 0;
    this.meta.bytes = 0;
    this.meta.lastFrameAt = null;

    this.ffmpeg = spawn(
      "ffmpeg",
      [
        "-rtsp_transport",
        "tcp",
        "-fflags",
        "nobuffer",
        "-flags",
        "low_delay",
        "-i",
        this.rtspUrl,

        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-tune",
        "zerolatency",
        "-pix_fmt",
        "yuv420p",
        "-profile:v",
        "baseline",
        "-level",
        "3.1",

        "-r",
        "25",
        "-g",
        "60",
        "-keyint_min",
        "60",
        "-sc_threshold",
        "0",

        "-movflags",
        "frag_keyframe+empty_moov+default_base_moof",
        "-f",
        "mp4",
        "pipe:1",
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    this.meta.fps = 25;


    // ===== VIDEO OUTPUT (CRITICAL) =====
    this.ffmpeg.stdout.on("data", (chunk) => {
      this.meta.frames++;
      this.meta.bytes += chunk.length;
      this.meta.lastFrameAt = Date.now();

      for (const ws of this.clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(chunk);
        }
      }
    });

    // ===== METADATA EXTRACTION =====
    this.ffmpeg.stderr.on("data", (data) => {
      const line = data.toString();

      if (!this.meta.codec && line.includes("Video:")) {
        const codecMatch = line.match(/Video:\s([a-z0-9_]+)/i);
        if (codecMatch) this.meta.codec = codecMatch[1];

        const resMatch = line.match(/(\d{2,5})x(\d{2,5})/);
        if (resMatch) {
          this.meta.resolution = `${resMatch[1]}x${resMatch[2]}`;
        }
      }
    });

    // ===== HANDLE FFmpeg EXIT =====
    this.ffmpeg.on("close", (code, signal) => {
      console.warn(`⏹ Camera ${this.cameraId} stopped (code=${code}, signal=${signal})`);
      this.ffmpeg = null;
    });

    this.ffmpeg.on("error", (err) => {
      console.error(`❌ FFmpeg error on camera ${this.cameraId}`, err);
      this.stop();
    });
  }

  // ===== CLIENT MANAGEMENT =====
  addClient(ws) {
    this.clients.add(ws);
    this.start();
  }

  removeClient(ws) {
    this.clients.delete(ws);
    if (this.clients.size === 0) this.stop();
  }

  stop() {
    if (!this.ffmpeg) return;

    console.log(`■ Stopping camera ${this.cameraId}`);
    this.ffmpeg.kill("SIGTERM");
    this.ffmpeg = null;
  }

  // ===== DASHBOARD HELPERS =====
  getBitrateKbps() {
    if (!this.meta.startedAt) return null;

    const seconds = (Date.now() - this.meta.startedAt) / 1000;
    if (seconds <= 0) return null;

    return Math.round((this.meta.bytes * 8) / 1000 / seconds);
  }

  isOnline() {
    return this.meta.lastFrameAt && Date.now() - this.meta.lastFrameAt < 5000;
  }
}

module.exports = StreamInstance;
