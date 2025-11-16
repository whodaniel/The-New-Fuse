// This script tests the VSCode extension's WebSocket server with the new message types
const WebSocket = require('ws');

console.log('Testing VSCode extension WebSocket server with new message types...');

// Create WebSocket connection
const ws = new WebSocket('ws://localhost:3710');

// Connection opened
ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send authentication message
  const authMessage = {
    type: 'AUTH',
    token: 'test-token',
    timestamp: Date.now()
  };
  
  console.log('Sending authentication message:', authMessage);
  ws.send(JSON.stringify(authMessage));
  
  // Send ping message after 1 second
  setTimeout(() => {
    const pingMessage = {
      type: 'PING',
      timestamp: Date.now()
    };
    
    console.log('Sending ping message:', pingMessage);
    ws.send(JSON.stringify(pingMessage));
  }, 1000);
  
  // Send code input message after 2 seconds
  setTimeout(() => {
    const codeMessage = {
      type: 'CODE_INPUT',
      code: 'console.log("Hello from test script!");',
      timestamp: Date.now()
    };
    
    console.log('Sending code input message:', codeMessage);
    ws.send(JSON.stringify(codeMessage));
  }, 2000);
  
  // Send AI query message after 3 seconds
  setTimeout(() => {
    const aiQueryMessage = {
      type: 'AI_QUERY',
      data: {
        query: 'How can I optimize this code: function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }'
      },
      timestamp: Date.now()
    };
    
    console.log('Sending AI query message:', aiQueryMessage);
    ws.send(JSON.stringify(aiQueryMessage));
  }, 3000);
  
  // Send status request message after 4 seconds
  setTimeout(() => {
    const statusRequestMessage = {
      type: 'STATUS_REQUEST',
      timestamp: Date.now()
    };
    
    console.log('Sending status request message:', statusRequestMessage);
    ws.send(JSON.stringify(statusRequestMessage));
  }, 4000);
  
  // Send disconnect message after 6 seconds
  setTimeout(() => {
    const disconnectMessage = {
      type: 'DISCONNECT',
      timestamp: Date.now()
    };
    
    console.log('Sending disconnect message:', disconnectMessage);
    ws.send(JSON.stringify(disconnectMessage));
  }, 6000);
});

// Listen for messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message:', message);
  } catch (error) {
    console.error('Error parsing message:', error);
    console.log('Raw message:', data.toString());
  }
});

// Connection closed
ws.on('close', (code, reason) => {
  console.log(`Connection closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
  process.exit(0);
});

// Connection error
ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  process.exit(1);
});
