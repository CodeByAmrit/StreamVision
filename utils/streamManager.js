const StreamInstance = require("./stream-instance");
const HlsStream = require("./hls-stream");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

class DVRManager {
  constructor() {
    this.streams = new Map(); // Legacy WS streams
    this.hlsStreams = new Map(); // New HLS streams
    
    // Ensure streams directory exists
    this.streamDir = path.join(__dirname, "../streams");
    if (!fs.existsSync(this.streamDir)) {
        fs.mkdirSync(this.streamDir);
    }
  }

  // ===== WS / Legacy Methods =====
  getStream(dvrId) {
    return this.streams.get(dvrId);
  }

  createStream(dvrId, rtspUrl) {
    if (!this.streams.has(dvrId)) {
      this.streams.set(dvrId, new StreamInstance(dvrId, rtspUrl));
    }
    return this.streams.get(dvrId);
  }

  removeStream(dvrId) {
    this.streams.delete(dvrId);
  }

  // ===== HLS Methods =====
  
  hashUrl(rtspUrl) {
    return crypto.createHash("md5").update(rtspUrl).digest("hex");
  }

  startHlsStream(rtspUrl) {
    const id = this.hashUrl(rtspUrl);
    
    if (this.hlsStreams.has(id)) {
        return { id, stream: this.hlsStreams.get(id), created: false };
    }

    const stream = new HlsStream(id, rtspUrl, this.streamDir);
    stream.start();
    this.hlsStreams.set(id, stream);
    
    // Auto-stop after 10 mins (optional, but good for resources)
    setTimeout(() => {
        this.stopHlsStream(rtspUrl);
    }, 10 * 60 * 1000);

    return { id, stream, created: true };
  }

  stopHlsStream(rtspUrl) {
    const id = this.hashUrl(rtspUrl);
    const stream = this.hlsStreams.get(id);
    if (stream) {
        stream.cleanup();
        this.hlsStreams.delete(id);
    }
  }

  getHlsStream(rtspUrl) {
    const id = this.hashUrl(rtspUrl);
    return this.hlsStreams.get(id);
  }
}

module.exports = new DVRManager();
