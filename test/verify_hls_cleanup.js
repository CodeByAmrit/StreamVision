const fs = require("fs");
const path = require("path");
const streamStore = require("../utils/streamStore");

const rtspUrl = "rtsp://mock-camera/live";
const streamId = streamStore.hashRtspUrl(rtspUrl);
const streamDir = path.join(__dirname, "..", "streams");

async function runTest() {
  console.log("--- HLS Cleanup Verification ---");

  // 1. Prepare Environment
  if (!fs.existsSync(streamDir)) {
    fs.mkdirSync(streamDir, { recursive: true });
  }

  const parentPath = path.join(streamDir, streamId);
  if (fs.existsSync(parentPath)) {
    fs.rmSync(parentPath, { recursive: true, force: true });
  }
  fs.mkdirSync(parentPath, { recursive: true });

  // 2. Create Stale Content
  const staleFolder = path.join(parentPath, "old_session_12345");
  fs.mkdirSync(staleFolder, { recursive: true });
  fs.writeFileSync(path.join(staleFolder, "stale.txt"), "stale data");
  console.log("Created stale folder:", staleFolder);

  // 3. Verify existence
  if (fs.existsSync(staleFolder)) {
    console.log("Verified: Stale folder exists.");
  } else {
    throw new Error("Failed to create stale folder");
  }

  // 4. Run startHlsStream (only interest is directory cleanup)
  console.log("Running startHlsStream...");
  try {
    // This will attempt to start ffmpeg. We don't care if ffmpeg fails
    // as long as the directory preparation (which happens first) succeeds.
    await streamStore.startHlsStream(rtspUrl, "test-cam", null);
  } catch (err) {
    // Expected if FFmpeg doesn't start, but we continue to check dirs
    console.log("Note: startHlsStream proceeded (may have failed spawning FFmpeg):", err.message);
  }

  // 5. Final Verification
  if (!fs.existsSync(staleFolder)) {
    console.log("SUCCESS: Stale folder was successfully REMOVED by startHlsStream.");
  } else {
    console.error("FAILURE: Stale folder STILL EXISTS.");
    process.exit(1);
  }

  // 6. Cleanup after test
  streamStore.stopHlsStream(rtspUrl);
  console.log("Test complete.");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test script crashed:", err);
  process.exit(1);
});
