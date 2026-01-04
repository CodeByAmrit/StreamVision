export async function probeCamera(camera) {
  const start = Date.now();

  try {
    await execPromise(
      `ffprobe -timeout 3000000 -i "${camera.rtsp_url}" -v error -show_entries format=duration`
    );

    const latency = Date.now() - start;

    await db.query(
      `
      INSERT INTO camera_health
      (camera_id, is_online, latency_ms, last_frame_at)
      VALUES (?, 1, ?, NOW())
      `,
      [camera.id, latency]
    );
  } catch {
    await db.query(
      `
      INSERT INTO camera_health
      (camera_id, is_online, checked_at)
      VALUES (?, 0, NOW())
      `,
      [camera.id]
    );
  }
}
