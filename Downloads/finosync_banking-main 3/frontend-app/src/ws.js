let socket = null;
const listeners = [];
let userIdStored = null;     // store userId for reconnection
let tokenStored = null;
function createSocket() {
  const ws = new WebSocket("ws://localhost:8000/ws");

  ws.onopen = () => {
    console.log("WS connected");

    // ⭐ AUTH step (required for per-user updates)
    if (userIdStored) {
      ws.send(
        JSON.stringify({
          type: "auth",
          userId: userIdStored,
        })
      );
    }
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      console.error("WS parse error:", e);
      return;
    }
    listeners.forEach((fn) => fn(msg));
  };

  ws.onclose = () => {
    console.log("WS disconnected, retrying...");
    setTimeout(() => {
      socket = createSocket();
    }, 2000);
  };

  return ws;
}

export function connectWS(onMessage) {
  if (onMessage && typeof onMessage === "function") {
    listeners.push(onMessage);
  }

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = createSocket();
  }

  // Return cleanup function
  return () => {
    if (onMessage) {
      const index = listeners.indexOf(onMessage);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  };
}
/* ============================================================
   PUBLIC API #2 — NEW initSocket(token, userId)
   (Used after login to authenticate the WS)
   ============================================================ */
export function initSocket(token, userId) {
  tokenStored = token;
  userIdStored = userId;

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = createSocket();
  } else {
    // If already open, send auth immediately
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "auth",
          userId: userIdStored,
        })
      );
    }
  }

  return socket;
}

/* ============================================================
   PUBLIC API #3 — Investment Update Helpers
   ============================================================ */
export function onInvestmentUpdate(handler) {
  const wrapper = (msg) => {
    if (msg?.type === "investment_update") {
      handler(msg);
    }
  };

  listeners.push(wrapper);

  return () => {
    offInvestmentUpdate(wrapper);
  };
}

export function offInvestmentUpdate(handler) {
  const index = listeners.indexOf(handler);
  if (index !== -1) {
    listeners.splice(index, 1);
  }
}
