#!/usr/bin/env node

/**
 * Ultra-Simple MCP Server for Chrome Extension
 * HTTP server with basic WebSocket upgrade support
 */

const http = require('http');
const { createHash } = require('crypto');

const PORT = 3001;

// WebSocket magic string for handshake
const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function generateAcceptValue(key) {
  return createHash('sha1')
    .update(key + WS_MAGIC_STRING)
    .digest('base64');
}

const server = http.createServer((req, res) => {
  console.log(`📡 HTTP ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'MCP Server' }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <h1>🚀 MCP Server Running</h1>
    <p>WebSocket endpoint: ws://localhost:3001</p>
    <p>Status: Ready for Chrome Extension</p>
  `);
});

server.on('upgrade', (request, socket, head) => {
  console.log('🔄 WebSocket upgrade request received');
  
  const key = request.headers['sec-websocket-key'];
  const acceptValue = generateAcceptValue(key);
  
  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptValue}`,
    '', ''
  ].join('\r\n');
  
  socket.write(responseHeaders);
  
  console.log('✅ WebSocket connection established');
  
  // Send welcome message
  const welcomeMsg = JSON.stringify({
    type: 'welcome',
    message: 'MCP Server connected',
    timestamp: new Date().toISOString()
  });
  
  // Simple WebSocket frame (text frame, no masking for server->client)
  const frame = Buffer.alloc(2 + welcomeMsg.length);
  frame[0] = 0x81; // FIN + text frame
  frame[1] = welcomeMsg.length; // Payload length
  frame.write(welcomeMsg, 2);
  socket.write(frame);
  
  socket.on('data', (buffer) => {
    console.log('📨 WebSocket data received from Chrome Extension');
    
    // Send back a simple response
    const response = JSON.stringify({
      type: 'response',
      status: 'received',
      timestamp: new Date().toISOString()
    });
    
    const responseFrame = Buffer.alloc(2 + response.length);
    responseFrame[0] = 0x81;
    responseFrame[1] = response.length;
    responseFrame.write(response, 2);
    socket.write(responseFrame);
  });
  
  socket.on('close', () => {
    console.log('❌ WebSocket connection closed');
  });
  
  socket.on('error', (err) => {
    console.error('❌ Socket error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 MCP Server running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
  console.log(`💚 Ready for Chrome Extension connections`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
