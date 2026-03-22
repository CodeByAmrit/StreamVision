const fs = require("fs");
const path = require("path");
const { startHlsStream, stopHlsStream, cleanupAll } = require("../utils/streamStore");

async function verify() {
  const rtspUrl = "rtsp://example.com/stream1";

  console.log("--- Test 1: Start Stream ---");
  const result1 = await startHlsStream(rtspUrl, "1", "1");
  console.log("HLS URL 1:", result1.hlsUrl);

  const parts = result1.hlsUrl.split("/");
  const streamId = parts[2];
  const timestamp1 = parts[3];

  const path1 = path.join(__dirname, "..", "streams", streamId, timestamp1);
  console.log("Path 1 exists:", fs.existsSync(path1));

  console.log("\n--- Test 2: Restart same RTSP ---");
  // Wait a bit to ensure different timestamp if we were starting a NEW one,
  // but startHlsStream should return the SAME one if already active.
  const result2 = await startHlsStream(rtspUrl, "1", "1");
  console.log("HLS URL 2 (should be same):", result2.hlsUrl);
  console.log("URLs match:", result1.hlsUrl === result2.hlsUrl);

  console.log("\n--- Test 3: Stop Stream and Cleanup ---");
  stopHlsStream(rtspUrl);

  // Wait for FFmpeg 'close' event (mocked or real)
  // In our real code, we kill('SIGINT'), which triggers 'close'.
  // Since we are running in a script, we might need to manually trigger or wait.
  // For this verification, I'll just check if the folder is gone after a short sleep
  // (assuming the mock FFmpeg closes immediately).

  setTimeout(() => {
    console.log("Path 1 still exists (after stop):", fs.existsSync(path1));
    const parentPath = path.join(__dirname, "..", "streams", streamId);
    console.log("Parent path still exists:", fs.existsSync(parentPath));

    // Final cleanup
    cleanupAll();
    console.log(
      "Streams directory exists (after cleanupAll):",
      fs.existsSync(path.join(__dirname, "..", "streams"))
    );
  }, 2000);
}

// Note: This script requires 'streams' dir to exist in the parent.
// It also depends on 'ffmpeg' being in the path if run for real.
verify();
