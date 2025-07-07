// Simple WebSocket server for testing the Chrome extension
const WebSocket = require('ws');
const http = require('http');

// Create WebSocket server on port 8080
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('The New Fuse WebSocket Server is running');
});

const wss = new WebSocket.Server({ server });

// Keep track of all connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'server_info',
    message: 'Connected to The New Fuse WebSocket Server',
    timestamp: new Date().toISOString()
  }));

  // Handle messages from clients
  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    
    try {
      const parsedMessage = JSON.parse(message.toString());
      
      // Echo the message back to the client with server timestamp
      ws.send(JSON.stringify({
        type: 'echo',
        originalMessage: parsedMessage,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to parse message',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log(`HTTP info page available at http://localhost:${PORT}`);
});

// Send heartbeat to all clients every 30 seconds
setInterval(() => {
  const clientCount = clients.size;
  console.log(`Sending heartbeat to ${clientCount} client(s)`);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        connectedClients: clientCount
      }));
    }
  });
}, 30000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  // Close all client connections gracefully
  wss.clients.forEach((client) => {
    client.close(1000, 'Server shutting down');
  });
  
  // Close the HTTP server
  server.close(() => {
    console.log('Server has been shut down');
    process.exit(0);
  });
});
