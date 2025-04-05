const { parentPort, workerData } = require('worker_threads');
const { spawn } = require('child_process');
const fs = require('fs');

// Ensure output path exists
fs.mkdirSync(workerData.outputPath, { recursive: true });

const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-fflags', 'nobuffer',                        // Minimize latency in input
    '-flags', 'low_delay',                        // Low-latency processing
    '-strict', 'experimental',
    '-i', workerData.rtspUrl,
    '-c:v', 'copy',                               // No re-encoding = faster
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',

    // HLS-specific options
    '-f', 'hls',
    '-hls_time', '2',                             // Short segments (2s)
    '-hls_list_size', '3',                        // Only 3 segments in the playlist
    '-hls_flags', 'delete_segments+omit_endlist+discont_start', // Low-latency flags
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', `${workerData.outputPath}/segment_%03d.ts`,
    `${workerData.outputPath}/index.m3u8`
], {
    stdio: 'ignore'
});

console.log(`Starting FFmpeg for ${workerData.cameraId}...`);

