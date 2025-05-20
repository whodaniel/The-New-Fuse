// Script to send a test message to the WebSocket server
const WebSocket = require('ws');

// Create a WebSocket client
const ws = new WebSocket('ws://localhost:3710');

// Connection opened
ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send a test message
  const message = {
    type: 'AI_RESPONSE',
    result: 'This is a test message from the terminal. If you see this in the Chrome extension, the WebSocket connection is working!',
    timestamp: Date.now()
  };
  
  console.log('Sending message:', message);
  ws.send(JSON.stringify(message));
  
  // Wait a bit and then close the connection
  setTimeout(() => {
    console.log('Closing connection');
    ws.close();
    process.exit(0);
  }, 2000);
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
});

// Connection error
ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  process.exit(1);
});
