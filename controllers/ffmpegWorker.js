const { parentPort, workerData } = require('worker_threads');
const { spawn } = require('child_process');

const { cameraId, cameraUrl, streamPath } = workerData;

const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', cameraUrl,
    '-fflags', 'nobuffer',
    '-flags', 'low_delay',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-c:v', 'libx264',
    '-b:v', '800k',
    '-g', '30',
    '-sc_threshold', '0',
    '-bufsize', '500k',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '4',
    '-hls_flags', 'delete_segments+append_list',
    '-hls_allow_cache', '0',
    streamPath
]);

ffmpeg.stderr.on('data', (data) => console.log(`FFmpeg [Camera ${cameraId}]: ${data}`));
ffmpeg.on('exit', () => console.log(`FFmpeg process for Camera ${cameraId} exited`));

parentPort.on('message', (msg) => {
    if (msg === 'stop') {
        ffmpeg.kill('SIGKILL');
    }
});
