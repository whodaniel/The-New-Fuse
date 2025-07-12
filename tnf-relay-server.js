#!/usr/bin/env node

/**
 * TNF Relay WebSocket Server
 * Simple relay server for testing the Chrome extension
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = 8765;

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  // Add CORS headers for Chrome extension access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT, timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end('TNF Relay Server');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/',
  perMessageDeflate: false
});

// Track connected clients
const clients = new Map();
let clientIdCounter = 0;

console.log(`🚀 TNF Relay Server starting on port ${PORT}...`);

wss.on('connection', (ws, req) => {
  const clientId = ++clientIdCounter;
  const clientInfo = {
    id: clientId,
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    connectedAt: new Date()
  };
  
  clients.set(ws, clientInfo);
  
  console.log(`✅ Client ${clientId} connected from ${clientInfo.ip}`);
  console.log(`   User-Agent: ${clientInfo.userAgent}`);
  console.log(`   Total clients: ${clients.size}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    message: 'Connected to TNF Relay Server',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Message from client ${clientId}:`, {
        type: message.type,
        action: message.action,
        hasData: !!message.data
      });

      // Echo the message back with server timestamp
      const response = {
        ...message,
        serverTimestamp: new Date().toISOString(),
        echoedBy: 'TNF Relay Server',
        originalClientId: clientId
      };

      // For element detection, simulate processing
      if (message.type === 'element_detection') {
        response.processed = true;
        response.status = 'received';
        console.log(`🎯 Element detection from client ${clientId}:`, {
          selector: message.data?.selector,
          url: message.data?.url,
          platform: message.data?.platform
        });
      }

      // For chat messages, simulate AI response
      if (message.type === 'chat_message') {
        console.log(`💬 Chat message from client ${clientId}: "${message.data?.message}"`);
        
        // Send immediate acknowledgment
        ws.send(JSON.stringify(response));

        // Send simulated AI response after a delay
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'ai_response',
            data: {
              message: `AI Response: I received your message "${message.data?.message}". This is a test response from the TNF Relay Server.`,
              timestamp: new Date().toISOString()
            },
            clientId: clientId
          }));
        }, 1000);
        return;
      }

      // Send response
      ws.send(JSON.stringify(response));

    } catch (error) {
      console.error(`❌ Error processing message from client ${clientId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle client disconnect
  ws.on('close', (code, reason) => {
    console.log(`❌ Client ${clientId} disconnected. Code: ${code}, Reason: ${reason}`);
    clients.delete(ws);
    console.log(`   Remaining clients: ${clients.size}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`🚨 WebSocket error for client ${clientId}:`, error);
    clients.delete(ws);
  });

  // Send periodic ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  ws.on('close', () => clearInterval(pingInterval));
});

// Start the server
server.listen(PORT, () => {
  console.log(`🌐 TNF Relay Server running on:`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`\n📡 Waiting for Chrome extension connections...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down TNF Relay Server...');
  wss.clients.forEach((ws) => {
    ws.terminate();
  });
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
