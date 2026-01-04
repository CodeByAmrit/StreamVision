const { exec } = require("child_process");
const db = require("../config/db");

/**
 * Extract static RTSP metadata ONCE
 * Called when camera is added or RTSP URL is updated
 */
async function extractAndStoreRtspMetadata(cameraId, rtspUrl) {
  return new Promise((resolve, reject) => {
    const cmd = `
      ffprobe -v error \
      -select_streams v:0 \
      -show_entries stream=codec_name,profile,width,height,avg_frame_rate \
      -of json "${rtspUrl}"
    `;

    exec(cmd, async (err, stdout) => {
      if (err) {
        console.error("[RTSP METADATA] ffprobe failed", err);
        return reject(err);
      }

      try {
        const data = JSON.parse(stdout);
        const stream = data.streams?.[0];
        if (!stream) return resolve(false);

        const fps = stream.avg_frame_rate ? Math.round(eval(stream.avg_frame_rate)) : null;

        await db.execute(
          `
          INSERT INTO camera_stream_info
          (camera_id, video_codec, resolution, fps, profile)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            video_codec = VALUES(video_codec),
            resolution = VALUES(resolution),
            fps = VALUES(fps),
            profile = VALUES(profile)
          `,
          [
            cameraId,
            stream.codec_name,
            `${stream.width}x${stream.height}`,
            fps,
            stream.profile || null,
          ]
        );

        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = { extractAndStoreRtspMetadata };
