const cameras = <% - JSON.stringify(cameras) %>;
const dvrId = <%= dvr.id %>;

cameras.forEach((camera, index) => {
    const video = document.getElementById(`video${index + 1}`);
    const source = `/streams/dvr_${dvrId}/cam_${camera.id}/index.m3u8`;

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(source);
        hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
    }
});