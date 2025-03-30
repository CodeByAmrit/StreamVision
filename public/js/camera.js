async function loadCameras() {
    const response = await fetch('http://localhost:5000/cameras');
    const cameras = await response.json();
    const container = document.getElementById('cameras');
    container.innerHTML = '';

    cameras.forEach(async camera => {
        const videoContainer = document.createElement('div');
        videoContainer.classList.add("bg-gray-800", "p-4", "rounded-lg", "shadow-lg");

        const title = document.createElement('h2');
        title.textContent = camera.name;
        title.classList.add("text-lg", "font-semibold", "mb-2");

        const video = document.createElement('video');
        video.classList.add("video-js", "vjs-default-skin", "w-full", "rounded-lg");
        video.setAttribute('controls', '');

        videoContainer.appendChild(title);
        videoContainer.appendChild(video);
        container.appendChild(videoContainer);

        const streamResponse = await fetch(`http://localhost:5000/stream/${camera.id}`);
        const { streamUrl } = await streamResponse.json();

        const player = videojs(video);
        player.src({ src: streamUrl, type: 'application/x-mpegURL' });
        player.play();
    });
}

async function addCamera() {
    const name = document.getElementById('camera-name').value;
    const url = document.getElementById('camera-url').value;
    await fetch('http://localhost:5000/cameras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, url }) });
    loadCameras();
}

loadCameras();
