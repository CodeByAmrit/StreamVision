async function loadCameras() {
  const response = await fetch("/cameras");
  const cameras = await response.json();
  const container = document.getElementById("cameras");
  container.innerHTML = "";

  cameras.forEach(async (camera) => {
    const videoContainer = document.createElement("div");
    videoContainer.classList.add(
      "bg-gray-800",
      "p-4",
      "rounded-lg",
      "shadow-lg",
      "flex",
      "flex-col",
      "items-center"
    );

    const title = document.createElement("h2");
    title.textContent = camera.name;
    title.classList.add("text-lg", "font-semibold", "mb-2", "text-center");

    const video = document.createElement("video");
    video.classList.add("video-js", "vjs-default-skin", "w-full", "rounded-lg");
    video.setAttribute("controls", "");

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("bg-red-500", "text-white", "p-2", "rounded-lg", "mt-3", "w-full");
    deleteBtn.onclick = () => deleteCamera(camera.id);

    videoContainer.appendChild(title);
    videoContainer.appendChild(video);
    videoContainer.appendChild(deleteBtn);
    container.appendChild(videoContainer);

    const streamResponse = await fetch(`/stream/${camera.id}`);
    const { streamUrl } = await streamResponse.json();

    const player = videojs(video);
    player.src({ src: streamUrl, type: "application/x-mpegURL" });
    // player.play();
  });
}

async function addCamera() {
  const name = document.getElementById("camera-name").value;
  const url = document.getElementById("camera-url").value;
  await fetch("/cameras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, url }),
  });
  loadCameras();
}

async function deleteCamera(id) {
  await fetch(`/cameras/${id}`, { method: "DELETE" });
  loadCameras();
}

loadCameras();
