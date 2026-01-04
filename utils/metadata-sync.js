const db = require("../config/db");
const dvrManager = require("./dvr-manager");

setInterval(async () => {
  for (const [cameraId, stream] of dvrManager.streams.entries()) {
    if (!stream.meta?.lastFrameAt) continue;

    await db.execute(
      `
      INSERT INTO camera_health
      (camera_id, is_online, last_frame_at)
      VALUES (?, 1, FROM_UNIXTIME(? / 1000))
      `,
      [cameraId, stream.meta.lastFrameAt]
    );
  }
}, 10000);
