// src/socket.js

const socket = new WebSocket("ws://localhost:8000/ws");

// Optional: console logs for debugging
socket.onopen = () => {
  console.log("WS Connected to FastBank");
};

socket.onclose = () => {
  console.log("WS Disconnected");
};

socket.onerror = (err) => {
  console.log("WS Error:", err);
};

export default socket;
