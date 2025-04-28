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
├── [app.js](http://_vscodecontentref_/1)                         # Main Express server
├── [cluster.js](http://_vscodecontentref_/2)                     # Cluster setup for multi-threaded server
├── [config.nginx](http://_vscodecontentref_/3)                   # Nginx configuration for reverse proxy
├── [ecosystem.config.js](http://_vscodecontentref_/4)            # PM2 process manager configuration
├── [package.json](http://_vscodecontentref_/5)                   # Project metadata and dependencies
├── [README.md](http://_vscodecontentref_/6)                      # Project documentation
├── [tailwind.config.js](http://_vscodecontentref_/7)             # Tailwind CSS configuration
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules

├── config/                        # Configuration files
│   └── getConnection.js           # Database connection logic

├── controllers/                   # Business logic
│   ├── camerasController.js       # Handles camera-related operations
│   ├── dvrController.js           # Handles DVR-related operations
│   └── publicStreamController.js  # Handles public stream-related operations

├── database/                      # Database-related files
│   └── structure.sql              # SQL script for database structure

├── models/                        # Data models
│   ├── cameraModel.js             # Camera model
│   └── user.js                    # User model

├── public/                        # Static assets and stream outputs
│   ├── site.webmanifest           # Web manifest for PWA
│   ├── up.html                    # Uptime status page
│   ├── css/                       # CSS files
│   ├── images/                    # Image assets
│   ├── js/                        # JavaScript files
│   └── streams/                   # HLS video output directories

├── routes/                        # Express route definitions
│   ├── camera.js                  # Camera-related routes
│   ├── cameraRoutes.js            # Additional camera routes
│   ├── dvrs.js                    # DVR-related routes
│   ├── publicRoutes.js            # Public-facing routes
│   └── userRouters.js             # User-related routes

├── services/                      # Service logic
│   ├── aouth.js                   # OAuth-related logic
│   ├── auth.js                    # Authentication logic
│   └── checkauth.js               # Middleware to check authentication

├── src/                           # Source files
│   └── input.css                  # Tailwind CSS input file

├── streams/                       # Stream-related files
│   └── (dynamic HLS stream folders created at runtime)

├── utils/                         # Utility functions
│   └── streamManager.js           # Manages active HLS streams

├── views/                         # EJS templates
│   └── dvr_live_public.ejs        # Public DVR stream view
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
