# Contributing to StreamVision

First off, thanks for taking the time to contribute to StreamVision! 🎉

StreamVision is a Node.js-based real-time DVR camera streaming platform that utilizes FFmpeg to convert RTSP streams to HLS for browser viewing. We welcome all types of contributions, including bug fixes, new features, UI improvements, and documentation updates.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Tech Stack](#tech-stack)
3. [Local Development Setup](#local-development-setup)
4. [Submitting a Pull Request](#submitting-a-pull-request)

## Code of Conduct
This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Tech Stack
Familiarize yourself with the technologies we use:
- **Backend:** Node.js, Express.js (handling API and stream orchestration)
- **Frontend:** React (in `client/`), EJS (legacy), Tailwind CSS
- **Streaming Engine:** FFmpeg (RTSP to HLS conversion)
- **Database:** MySQL
- **Containerization:** Docker & Docker Compose

## Local Development Setup

To get your development environment running:

1. **Prerequisites:**
   - Node.js (v14+)
   - MySQL
   - FFmpeg (must be installed on your system PATH)
   - Docker (optional, but recommended for testing full stack)

2. **Clone and Install:**
   ```bash
   git clone https://github.com/your-username/StreamVision.git
   cd StreamVision
   npm install
   cd client && npm install # for React frontend
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and fill in your database and JWT credentials.

4. **Running the App:**
   - Development server with auto-reload: `npm run dev`
   - Build React client: `cd client && npm run build`
   - Build CSS: `npm run build:css` (if modifying EJS/Tailwind styles)

## Submitting a Pull Request
1. Fork the repository and create your branch from `main`.
2. Make your changes in a cohesive commit.
3. If you change the streaming logic (app.js or streams manager), please ensure no memory leaks occur with rogue FFmpeg processes.
4. If you change the UI, ensure both the legacy EJS views and the new React App (`client/`) are considered.
5. Create the Pull Request using our provided PR template!
