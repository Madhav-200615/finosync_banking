let socket = null;
const listeners = [];

function createSocket() {
  const ws = new WebSocket("ws://localhost:8000/ws");

  ws.onopen = () => {
    console.log("WS connected");
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
}
