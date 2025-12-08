const WebSocket = require("ws");
const { logger } = require("../config/logger");

let wss = null;
const userSockets = new Map(); // { userId: Set<WebSocket> }

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

    /**
     * When the client sends messages:
     * We expect: { type: "auth", userId: <id> }
     */
    socket.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);

        // ⭐ Client authenticates to receive user-specific updates
        if (data.type === "auth" && data.userId) {
          const userId = data.userId.toString();

          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }

          userSockets.get(userId).add(socket);
          socket._userId = userId;

          logger.info(`WS: User ${userId} authenticated`);
        }
      } catch (err) {
        logger.error("WS message parse error:", err);
      }
    });

    // remove socket when closed
    socket.on("close", () => {
      if (socket._userId) {
        const set = userSockets.get(socket._userId);
        if (set) {
          set.delete(socket);
          if (set.size === 0) {
            userSockets.delete(socket._userId);
          }
        }
      }
    });
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

/* ============================================================
   ⭐ NEW: USER-SPECIFIC INVESTMENT UPDATES — REQUIRED FOR YONO
   ============================================================ */

/**
 * Broadcast investment update ONLY to that user
 *
 * Example broadcast payload:
 *   {
 *     type: "investment_update",
 *     action: "CREATED",
 *     investment: {...}
 *   }
 */
function broadcastInvestmentUpdate(userId, investment) {
  if (!userId || !wss) return;

  const userKey = userId.toString();
  const sockets = userSockets.get(userKey);
  if (!sockets || sockets.size === 0) return;

  const msg = JSON.stringify({
    type: "investment_update",
    action: "CREATED",
    investment,
  });

  sockets.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  });
}


function broadcastSipUpdate(userId, sip) {
  if (!wss) return;
  const msg = JSON.stringify({
    type: "sip",
    userId,
    sip
  });
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

module.exports = {
  initWsServer,
  broadcastTx,
  broadcastLoanUpdate,
  broadcastSipUpdate
};


/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  initWsServer,
  broadcastTx,
  broadcastLoanUpdate,
  broadcastInvestmentUpdate, // ⭐ VERY IMPORTANT
};
