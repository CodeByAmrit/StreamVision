const WebSocket = require("ws");
const db = require("../config/db");
const streamManager = require("../utils/streamManager");

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const cameraId = url.searchParams.get("camera");

      if (!cameraId) return ws.close();

      const [rows] = await db.execute(
        `SELECT rtsp_url FROM cameras WHERE id = ? AND enabled = 1`,
        [cameraId]
      );

      if (!rows.length) return ws.close();

      // FIX: use createStream instead of create
      const stream = streamManager.createStream(cameraId, rows[0].rtsp_url);

      // FIX: use correct method names
      stream.addClient(ws);

      ws.on("close", () => stream.removeClient(ws));
      ws.on("error", () => stream.removeClient(ws));
    } catch (err) {
      console.error("[WS ERROR]", err);
      ws.close();
    }
  });

  server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/ws")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  console.log("✅ WebSocket server initialized");
}

module.exports = initWebSocketServer;
