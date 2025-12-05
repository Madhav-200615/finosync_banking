const WebSocket = require("ws");
const { logger } = require("../config/logger");

let wss = null;

function initWsServer(httpServer) {
  wss = new WebSocket.Server({ server: httpServer, path: "/ws" });

  wss.on("connection", (socket) => {
    logger.info("WebSocket client connected");

    socket.send(
      JSON.stringify({
        type: "welcome",
        message: "WS connected to FastBank",
      })
    );
  });
}

// ⭐ Broadcast for transactions (old)
function broadcastTx(tx) {
  if (!wss) return;

  const msg = JSON.stringify({ type: "transaction", tx });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// ⭐ Broadcast for loans (new)
function broadcastLoanUpdate(update) {
  if (!wss) return;

  const msg = JSON.stringify({ type: "loan", update });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

module.exports = {
  initWsServer,
  broadcastTx,
  broadcastLoanUpdate,   // ⭐ important!
};
