const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3712 });

wss.on("connection", function connection(ws) {
  console.log("Client connected");
  ws.send("Hello from WebSocket server!");

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
});

console.log("WebSocket server running on ws://localhost:3712");
