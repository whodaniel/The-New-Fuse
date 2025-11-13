#!/usr/bin/env node

/**
 * Simple MCP WebSocket Server for Chrome Extension
 * This is a minimal server that runs on port 3001 to resolve the WebSocket connection error
 */

const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  port: 3001 
});

console.log('🚀 Starting Simple MCP Server on ws://localhost:3001');

wss.on('connection', function connection(ws, req) {
  console.log('✅ Chrome Extension connected via WebSocket');

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    message: 'MCP Server ready for automation commands'
  }));

  // Handle incoming messages
  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message);

      // Echo back a response
      ws.send(JSON.stringify({
        type: 'response',
        originalMessage: message,
        status: 'processed',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  ws.on('close', function close() {
    console.log('❌ Chrome Extension disconnected');
  });

  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
  });

  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      }));
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Every 30 seconds
});

wss.on('listening', () => {
  console.log('🎯 MCP Server listening on port 3001');
  console.log('🔗 Chrome Extension can now connect to ws://localhost:3001');
});

wss.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP Server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
