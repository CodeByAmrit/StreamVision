const { parentPort, workerData } = require('worker_threads');
const { spawn } = require('child_process');
const fs = require('fs');

// Ensure output path exists
fs.mkdirSync(workerData.outputPath, { recursive: true });

const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', workerData.rtspUrl,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-c:a', 'aac',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', `${workerData.outputPath}/segment_%03d.ts`,
    `${workerData.outputPath}/stream.m3u8`
]);

ffmpeg.stderr.on('data', (data) => {
    parentPort.postMessage({ type: 'log', data: data.toString() });
});

ffmpeg.on('exit', (code) => {
    parentPort.postMessage({ type: 'exit', code });
});
ffmpeg.on('error', (error) => {
    parentPort.postMessage({ type: 'error', error: error.message });
});