import { WebSocketServer } from 'ws';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('The New Fuse WebSocket Server is running');
});

// Create a WebSocket server
const wss = new WebSocketServer({
  server,
  // Allow connections from any origin
  verifyClient: (info) => {
    console.log(`Connection attempt from origin: ${info.origin}`);
    return true;
  }
});

const PORT = 3710;

// Store connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`New client connected from ${clientIp}`);
  clients.add(ws);
  
  // Handle authentication
  let isAuthenticated = false;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Handle authentication
      if (data.type === 'AUTH') {
        isAuthenticated = true;
        ws.send(JSON.stringify({
          type: 'AUTH_RESPONSE',
          success: true
        }));
        console.log('Client authenticated');
      }
      
      // Handle ping messages
      if (data.type === 'PING') {
        ws.send(JSON.stringify({
          type: 'PONG',
          timestamp: Date.now()
        }));
        console.log('Ping received, sent pong response');
      }
      
      // Handle code input
      if (data.type === 'CODE_INPUT' && isAuthenticated) {
        console.log('Received code input:', data.code ? data.code.substring(0, 50) + '...' : 'No code provided');
        // Echo back a response
        ws.send(JSON.stringify({
          type: 'AI_OUTPUT',
          output: `Received code: ${data.code ? data.code.substring(0, 50) + '...' : 'No code provided'}`,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      console.error('Raw message:', message.toString());
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Handle disconnection
  ws.on('close', (code, reason) => {
    console.log(`Client disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    clients.delete(ws);
  });
  
  // Send welcome message
  try {
    ws.send(JSON.stringify({
      type: 'SYSTEM',
      message: 'Connected to The New Fuse WebSocket Server',
      timestamp: Date.now()
    }));
    console.log('Sent welcome message to client');
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  // Close all client connections
  for (const client of clients) {
    client.close();
  }
  
  // Close the server
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});
