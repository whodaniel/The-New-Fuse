// Command-line WebSocket client for testing
const WebSocket = require('ws');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// WebSocket connection
let socket = null;
let isConnected = false;

// Connect to WebSocket server
function connect() {
  if (socket) {
    console.log('WebSocket connection already exists');
    return;
  }

  console.log('Connecting to WebSocket server...');

  try {
    socket = new WebSocket('ws://localhost:3711');

    socket.on('open', () => {
      console.log('WebSocket connection established');
      isConnected = true;

      // Send authentication
      socket.send(JSON.stringify({
        type: 'AUTH',
        token: 'test-token',
        timestamp: Date.now()
      }));

      console.log('Sent authentication message');
    });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed');
      socket = null;
      isConnected = false;
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  } catch (error) {
    console.error('Error creating WebSocket:', error);
  }
}

// Disconnect from WebSocket server
function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
    isConnected = false;
    console.log('Disconnected from WebSocket server');
  } else {
    console.log('Not connected to WebSocket server');
  }
}

// Send a message to the WebSocket server
function sendMessage(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('Cannot send message, not connected');
    return;
  }

  try {
    // If message is a string, try to parse it as JSON
    if (typeof message === 'string') {
      const parsed = JSON.parse(message);
      socket.send(message);
      console.log('Sent message:', parsed);
    } else {
      // If message is an object, stringify it
      socket.send(JSON.stringify(message));
      console.log('Sent message:', message);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Send a ping message
function sendPing() {
  sendMessage({
    type: 'PING',
    timestamp: Date.now()
  });
}

// Send a code input message
function sendCodeInput(code) {
  sendMessage({
    type: 'CODE_INPUT',
    code: code,
    timestamp: Date.now()
  });
}

// Process user commands
function processCommand(command) {
  const parts = command.trim().split(' ');
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case 'connect':
      connect();
      break;
    case 'disconnect':
      disconnect();
      break;
    case 'ping':
      sendPing();
      break;
    case 'code':
      const code = parts.slice(1).join(' ');
      sendCodeInput(code);
      break;
    case 'send':
      try {
        const json = parts.slice(1).join(' ');
        sendMessage(json);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
      break;
    case 'exit':
    case 'quit':
      disconnect();
      rl.close();
      process.exit(0);
      break;
    case 'help':
      console.log('Available commands:');
      console.log('  connect - Connect to WebSocket server');
      console.log('  disconnect - Disconnect from WebSocket server');
      console.log('  ping - Send a ping message');
      console.log('  code <code> - Send a code input message');
      console.log('  send <json> - Send a custom JSON message');
      console.log('  exit/quit - Exit the program');
      console.log('  help - Show this help message');
      break;
    default:
      console.log('Unknown command. Type "help" for available commands.');
  }
}

// Main loop
console.log('WebSocket Test Client');
console.log('Type "help" for available commands');

rl.on('line', (line) => {
  processCommand(line);
});

// Connect on startup
connect();
