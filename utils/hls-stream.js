const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class HlsStream {
  constructor(id, rtspUrl, streamDir) {
    this.id = id;
    this.rtspUrl = rtspUrl;
    this.streamDir = streamDir; // Main streams directory
    this.ffmpeg = null;
    this.createdAt = Date.now();
    
    // Output directory for this specific stream
    this.outputDir = path.join(this.streamDir, this.id);
    this.playlistPath = path.join(this.outputDir, "index.m3u8");

    // Metadata
    this.meta = {
      startedAt: null,
      resolution: null,
      fps: null,
      bitrateKbps: null,
      active: false
    };
  }

  start() {
    if (this.ffmpeg) return;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    console.log(`[HLS] Starting stream for ${this.id}`);
    this.meta.startedAt = Date.now();
    this.meta.active = true;

    this.ffmpeg = spawn(
      "ffmpeg",
      [
        "-rtsp_transport", "tcp",
        "-fflags", "nobuffer",
        "-flags", "low_delay",
        "-strict", "experimental",
        "-i", this.rtspUrl,
        
        "-c:v", "copy", // Copy video stream (fastest, no transcoding)
        "-an", // No audio for now (reduces latency/complexity)
        
        "-f", "hls",
        "-hls_time", "1",
        "-hls_list_size", "3",
        "-hls_flags", "delete_segments+omit_endlist+discont_start",
        "-hls_segment_type", "mpegts",
        "-hls_segment_filename", path.join(this.outputDir, "segment_%03d.ts"),
        this.playlistPath
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    this.ffmpeg.stderr.on("data", (data) => {
      const line = data.toString();
      // Basic extraction if needed, though copy codec might not show much
      if (!this.meta.resolution && line.includes("Video:")) {
        const resMatch = line.match(/(\d{2,5})x(\d{2,5})/);
        if (resMatch) {
            this.meta.resolution = `${resMatch[1]}x${resMatch[2]}`;
        }
      }
    });

    this.ffmpeg.on("close", (code) => {
      console.log(`[HLS] Stream ${this.id} stopped (code ${code})`);
      this.meta.active = false;
      this.ffmpeg = null;
      // Optional: Cleanup files immediately or let manager handle it
      // this.cleanup(); 
    });

    this.ffmpeg.on("error", (err) => {
      console.error(`[HLS] Error on stream ${this.id}:`, err);
      this.stop();
    });
  }

  stop() {
    if (this.ffmpeg) {
      this.ffmpeg.kill("SIGINT");
      this.ffmpeg = null;
      this.meta.active = false;
    }
  }

  cleanup() {
    this.stop();
    if (fs.existsSync(this.outputDir)) {
      try {
        fs.rmSync(this.outputDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`[HLS] Failed to cleanup dir ${this.outputDir}`, e);
      }
    }
  }
}

module.exports = HlsStream;
