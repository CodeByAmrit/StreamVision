const { spawn, execSync } = require('child_process');

const activeDvrProcesses = {}; // dvrId -> { pid, ip }

function startDvrStream(dvrId, username, password, ip) {
    if (activeDvrProcesses[dvrId]) {
        console.log(`DVR ${dvrId} already streaming.`);
        return;
    }

    const scriptPath = `${__dirname}/../scripts/startDvrStream.sh`;
    const child = spawn('bash', [scriptPath, username, password, ip], {
        detached: true,
        stdio: 'ignore'
    });

    activeDvrProcesses[dvrId] = {
        pid: child.pid,
        ip
    };

    child.unref();
    console.log(`Started stream for DVR ${dvrId} (PID: ${child.pid})`);
}

function stopDvrStream(dvrId) {
    const dvr = activeDvrProcesses[dvrId];
    if (!dvr) return;

    try {
        execSync(`pkill -f ${dvr.ip}`); // or improve to match full ffmpeg pattern
        console.log(`Stopped DVR ${dvrId} stream.`);
    } catch (e) {
        console.error(`Error stopping DVR ${dvrId}:`, e.message);
    }

    delete activeDvrProcesses[dvrId];
}

module.exports = {
    startDvrStream,
    stopDvrStream,
    activeDvrProcesses
};
