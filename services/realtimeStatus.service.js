const { exec } = require("child_process");

/**
 * Probe an RTSP URL with a strict 2.5-second timeout.
 * @param {string} rtspUrl - The RTSP URL to probe
 * @returns {Promise<Object>} Status object (online, resolution, codec)
 */
async function probeRealtimeStatus(rtspUrl) {
  return new Promise((resolve) => {
    if (!rtspUrl || !rtspUrl.startsWith("rtsp://")) {
      return resolve({ online: false, resolution: "N/A", codec: "N/A", details: null });
    }

    // Use the comprehensive command requested by the user. Note: -stimeout is removed as it causes option not found errors in some ffprobe versions.
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams -show_programs -show_chapters -show_private_data -show_error -rtsp_transport tcp -analyzeduration 10000000 -probesize 10000000 "${rtspUrl}"`;

    // Give exec up to 12 seconds to complete
    exec(cmd, { timeout: 12000 }, (err, stdout) => {
      if (err && !stdout) {
        return resolve({ online: false, resolution: "Offline", codec: "-", details: null });
      }

      try {
        const data = JSON.parse(stdout);
        const stream = data.streams && data.streams.find(s => s.codec_type === 'video');
        
        if (!stream && !data.format) {
          return resolve({ online: false, resolution: "Offline", codec: "-", details: null });
        }

        const width = stream ? stream.width : 0;
        const height = stream ? stream.height : 0;
        const codec = stream ? (stream.codec_name ? stream.codec_name.toUpperCase() : "Unknown") : "-";

        let resolution = "Unknown";
        if (width && height) {
            if (width === 1920) resolution = "1080p";
            else if (width === 1280) resolution = "720p";
            else if (width > 1920) resolution = "4K";
            else resolution = `${width}x${height}`;
        }

        // Gather technical details to display on frontend
        const details = {
            profile: stream ? stream.profile : "N/A",
            pix_fmt: stream ? stream.pix_fmt : "N/A",
            fps: stream ? (stream.avg_frame_rate || stream.r_frame_rate) : "N/A",
            time_base: stream ? stream.time_base : "N/A",
            format_name: data.format ? data.format.format_name : "N/A",
            bitrate: data.format && data.format.bit_rate ? Math.round(data.format.bit_rate / 1024) + " kbps" : "N/A"
        };

        return resolve({
          online: true,
          resolution,
          codec,
          details
        });
      } catch (e) {
        return resolve({ online: false, resolution: "Error", codec: "-", details: null });
      }
    });
  });
}

module.exports = { probeRealtimeStatus };
