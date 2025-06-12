// Simple WebSocket Test Server for The New Fuse Extension
// Run with: node websocket-test-server.js

const WebSocket = require('ws');

const PORT = 3712;

const wss = new WebSocket.Server({ 
  port: PORT,
  perMessageDeflate: false 
});

console.log(`🚀 WebSocket test server started on ws://localhost:${PORT}`);
console.log('📡 Waiting for Chrome extension connections...');

wss.on('connection', function connection(ws, request) {
  const clientIP = request.socket.remoteAddress;
  console.log(`✅ New client connected from ${clientIP}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '🎉 Connected to The New Fuse test server!',
    timestamp: Date.now()
  }));
  
  // Handle incoming messages
  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data);
      console.log('📨 Received:', message);
      
      // Echo back chat messages
      if (message.type === 'chat') {
        const response = {
          type: 'chat',
          message: `Echo: ${message.message}`,
          timestamp: Date.now(),
          source: 'server'
        };
        
        ws.send(JSON.stringify(response));
        console.log('📤 Sent echo:', response.message);
      }
      
      // Handle command requests
      if (message.type === 'command') {
        console.log('🔧 Command received:', message.command);
        
        // You can add custom command handling here
        const response = {
          type: 'chat',
          message: `Command executed: ${message.command}`,
          timestamp: Date.now(),
          source: 'server'
        };
        
        ws.send(JSON.stringify(response));
      }
      
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      console.log('Raw data:', data.toString());
    }
  });
  
  // Handle client disconnect
  ws.on('close', function close() {
    console.log(`❌ Client disconnected from ${clientIP}`);
  });
  
  // Handle errors
  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
  });
  
  // Send periodic ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});

// Handle server errors
wss.on('error', function error(err) {
  console.error('❌ Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('📋 Instructions:');
console.log('1. Make sure your Chrome extension is loaded');
console.log('2. Open the floating panel');
console.log('3. Connect to ws://localhost:3712');
console.log('4. Send test messages through the chat');
console.log('5. Press Ctrl+C to stop the server');
