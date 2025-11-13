// This script tests the VSCode extension's WebSocket server
const WebSocket = require('ws');

console.log('Testing VSCode extension WebSocket server...');

// Create WebSocket connection
const ws = new WebSocket('ws://localhost:3711'); // Changed from 3710 to match the test server

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

  // Close connection after 5 seconds
  setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
  }, 5000);
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
ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

// Connection error
ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  process.exit(1);
});
