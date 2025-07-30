
![Stream Vision](public/images/banner2.png)

# 📹 StreamVision

**StreamVision** is a Node.js-based real-time DVR camera streaming platform that allows users to stream multiple RTSP camera feeds directly in the browser. It supports dynamic DVR configurations, lazy loading of streams, and a responsive public viewer page.

---

## � Features

- 🔒 Dynamic DVR login with username/password/IP
- � Stream up to 16 RTSP camera channels per DVR
- ⚙️ FFmpeg-based RTSP to HLS conversion (one worker per DVR)
- 🌐 Public view for each DVR's live streams
- 🧠 Lazy loading of video players using Intersection Observer
- 🖥️ EJS templating with Tailwind CSS
- 📁 Organized architecture (routes, controllers, workers, views)

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** EJS, Tailwind CSS, Video.js
- **Streaming Engine:** FFmpeg (RTSP → HLS)
- **Database:** MySQL (for DVRs, Cameras, Locations)
- **Worker Management:** `worker_threads` (Node.js)

---

## 📁 Project Structure

```bash
StreamVision/
├── app.js                         # Main Express server
├── cluster.js                     # Cluster setup for multi-threaded server
├── config.nginx                   # Nginx configuration for reverse proxy
├── ecosystem.config.js            # PM2 process manager configuration
├── package.json                   # Project metadata and dependencies
├── README.md                      # Project documentation
├── tailwind.config.js             # Tailwind CSS configuration
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
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14+ recommended)
- MySQL database
- FFmpeg installed on your system
- Nginx (for production deployment)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory with the following variables:

```ini
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_DATABASE=streamvision
DB_PORT=3306

# JWT Configuration
jwt_token=your_jwt_secret

# Password Hashing
saltRounds=10

# SSL Configuration (Optional)
DB_CA=/path/to/your/server-cert.pem
```

### 3. Database Setup
Import the database structure from `database/structure.sql` to your MySQL server.

### 4. Build CSS
```bash
npm run build:css
```

---

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using PM2 (Production)
```bash
npm run start:pm2
```

### Nginx Setup (Production)
```bash
# Install Nginx (Ubuntu/Debian)
sudo apt update && sudo apt install -y nginx

# Restart Nginx
npm run restart:nginx
```

---

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Starts the production server |
| `npm run dev` | Starts the development server with nodemon |
| `npm run build:css` | Builds Tailwind CSS |
| `npm run start:pm2` | Starts the app using PM2 process manager |
| `npm run restart:nginx` | Restarts Nginx service |
| `npm run setup:linux` | Installs all required Linux dependencies |

---

## 📦 Dependencies

### Core Dependencies
- Express.js
- MySQL2
- FFmpeg
- Tailwind CSS
- Video.js
- JWT for authentication
- Bcrypt for password hashing

### Development Dependencies
- Nodemon
- Express Status Monitor

---

## 📄 License
ISC © Amrit

---

## 🙏 Acknowledgments
- FFmpeg team for powerful media processing
- Video.js for excellent player implementation
- Tailwind CSS for utility-first styling
