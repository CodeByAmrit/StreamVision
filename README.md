![Stream Vision](public/images/banner.svg)

# 📹 StreamVision

**StreamVision** is a Node.js-based real-time DVR camera streaming platform that allows users to stream multiple RTSP camera feeds directly in the browser. It supports dynamic DVR configurations, lazy loading of streams, and a responsive public viewer page.

---

## 🚀 Features

- 🔒 Dynamic DVR login with username/password/IP
- 🎥 Stream up to 16 RTSP camera channels per DVR
- ⚙️ FFmpeg-based RTSP to HLS conversion (one worker per DVR)
- 🌐 Public view for each DVR's live streams
- 🧠 Lazy loading of video players using Intersection Observer
- 🖥️ EJS templating with Tailwind CSS
- 📁 Organized architecture (routes, controllers, workers, views)

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** EJS, Tailwind CSS, Video.js
- **Streaming Engine:** FFmpeg (RTSP → HLS)
- **Database:** MySQL (for DVRs, Cameras, Locations)
- **Worker Management:** `worker_threads` (Node.js)

---

## 📁 Project File Structure

```bash
StreamVision/
├── app.js                         # Main Express server
├── package.json                   # Project metadata and dependencies
├── .env                           # Environment variables
├── README.md                      # Project documentation

├── public/                        # Static assets and stream outputs
│   └── streams/                   # HLS video output directories
│       └── dvr_<id>/cam_<id>/     # Each DVR and camera has its own stream folder

├── views/                         # EJS templates
│   └── dvr_live_public.ejs        # Public DVR stream view

├── routes/                        # Express route definitions
│   └── dvrRoutes.js               # DVR stream-related routes

├── controllers/                   # Business logic
│   └── dvrController.js           # Fetch DVR, camera, and location data

├── workers/                       # FFmpeg streaming and management logic
│   ├── streamWorker.js            # FFmpeg process for DVR (handles all 16 cameras)
│   └── streamManager.js           # Manages active worker processes per DVR

├── utils/                         # Utility functions (optional)
│   └── cleanupStreams.js          # Scheduled cleanup for inactive HLS streams (if used)

└── config/                        # Configuration files (optional)
    └── db.js                      # Database connection setup
```

---

## ⚙️ Setup Instructions

### 1. 📦 Install Dependencies

```bash 
npm install
```

### 2. 🛠️ FFmpeg Setup
- Make sure FFmpeg is installed and accessible in your environment:

### 3. Set Up Configuration

Create a `.env` file and add:

```ini
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=streamvision

```

 ### 4. 🧠 Run the App
```bash 
node app.js
```
