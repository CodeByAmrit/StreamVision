const { spawn } = require("child_process");

class StreamInstance {
    constructor(cameraId, rtspUrl) {
        this.cameraId = cameraId;
        this.rtspUrl = rtspUrl;
        this.clients = new Set();
        this.ffmpeg = null;
    }

    start() {
        if (this.ffmpeg) return;

        console.log(`▶ Starting camera ${this.cameraId}`);

        this.ffmpeg = spawn("ffmpeg", [
            "-rtsp_transport", "tcp",
            "-fflags", "nobuffer",
            "-flags", "low_delay",
            "-i", this.rtspUrl,

            "-an",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "zerolatency",
            "-pix_fmt", "yuv420p",
            "-profile:v", "baseline",
            "-level", "3.1",

            "-g", "30",
            "-keyint_min", "30",
            "-sc_threshold", "0",

            "-movflags", "frag_keyframe+empty_moov+default_base_moof",
            "-f", "mp4",
            "pipe:1",
        ]);

        this.ffmpeg.stdout.on("data", (chunk) => {
            for (const ws of this.clients) {
                if (ws.readyState === ws.OPEN) {
                    ws.send(chunk);
                }
            }
        });

        this.ffmpeg.on("close", () => {
            this.ffmpeg = null;
            console.log(`⏹ Camera ${this.cameraId} stopped`);
        });
        // this.ffmpeg.stderr.on("data", (data) => {
        //     console.log(`[FFmpeg ${this.cameraId}] ${data.toString()}`);
        // });
    }

    addClient(ws) {
        this.clients.add(ws);
        this.start();
    }

    removeClient(ws) {
        this.clients.delete(ws);
        if (this.clients.size === 0) this.stop();
    }

    stop() {
        if (this.ffmpeg) {
            this.ffmpeg.kill("SIGTERM");
            this.ffmpeg = null;
        }
    }
}

module.exports = StreamInstance;
