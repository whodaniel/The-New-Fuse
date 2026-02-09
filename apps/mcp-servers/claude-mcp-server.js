
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3712 });

wss.on('connection', ws => {
  console.log('Claude MCP Server: Client connected');

  ws.on('message', message => {
    console.log('received: %s', message);
    // Placeholder for message processing logic
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.send('Welcome to the Claude MCP Server');
});

console.log('Claude MCP Server listening on port 3712');
