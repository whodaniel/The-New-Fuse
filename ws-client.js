const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:3712");

ws.on("open", function open() {
  console.log("Connected to WebSocket server");
  ws.send("Test message from Node.js client");
});

ws.on("message", function incoming(message) {
  console.log("Received:", message.toString());
});

ws.on("error", function error(err) {
  console.error("WebSocket error:", err);
});
