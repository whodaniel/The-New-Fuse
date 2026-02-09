
const WebSocket = require('ws');
const http = require('http');
const { ToolboxClient } = require('@toolbox-sdk/core');

const TOOLBOX_SERVICE_URL = process.env.TOOLBOX_SERVICE_URL || 'http://127.0.0.1:5000'; // Replace with your Toolbox service URL
const client = new ToolboxClient(TOOLBOX_SERVICE_URL);

const wss = new WebSocket.Server({ port: 3713 });

wss.on('connection', ws => {
  console.log('Gemini MCP Server: Client connected');

  ws.on('message', async message => {
    console.log('received: %s', message);
    try {
      const request = JSON.parse(message);
      if (request.tool && request.params) {
        console.log(`Attempting to invoke tool: ${request.tool} with params:`, request.params);
        const tool = await client.loadTool(request.tool);
        const result = await tool(request.params);
        ws.send(JSON.stringify({ status: 'success', result }));
      } else {
        ws.send(JSON.stringify({ status: 'error', message: 'Invalid message format. Expected { tool: "toolName", params: {} }' }));
      }
    } catch (error) {
      console.error('Error processing message or invoking tool:', error);
      ws.send(JSON.stringify({ status: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.send('Welcome to the Gemini MCP Server');
});

console.log('Gemini MCP Server listening on port 3713');

// Health check server
const healthPort = process.env.PORT || 3004;
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(healthPort, () => {
  console.log(`Health check server listening on port ${healthPort}`);
});
