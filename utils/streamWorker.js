const { parentPort, workerData } = require('worker_threads');
const { spawn } = require('child_process');
const fs = require('fs');

// Ensure output path exists
fs.mkdirSync(workerData.outputPath, { recursive: true });

const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', workerData.rtspUrl, // Example: rtsp://username:password@ip:554/cam/realmonitor?channel=1&subtype=1
    '-c:v', 'copy',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_list_size', '3',
    '-hls_flags', 'delete_segments+omit_endlist',
    '-hls_segment_filename', `${workerData.outputPath}/segment_%03d.ts`,
    `${workerData.outputPath}/index.m3u8`
], {
    stdio: 'ignore', // Optional: if you want to suppress logs like > /dev/null 2>&1
});

