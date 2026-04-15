// Test script for reconnection logic
const WebSocket = require('ws');

// Configuration
const WS_HOST = 'localhost';
const WS_PORT = 3710;
const WS_URL = `ws://${WS_HOST}:${WS_PORT}`;
const MAX_RECONNECT_ATTEMPTS = 5;

// Test reconnection logic
async function testReconnection() {
  console.log('Testing WebSocket reconnection logic...');
  
  let reconnectAttempts = 0;
  let ws = null;
  
  function connect() {
    console.log(`Connection attempt ${reconnectAttempts + 1}...`);
    
    ws = new WebSocket(WS_URL, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    ws.on('open', () => {
      console.log('Connected successfully');
      reconnectAttempts = 0;
      
      // Send authentication message
      const authMessage = {
        type: 'AUTH',
        token: 'test-token'
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('Sent authentication message');
      
      // Simulate connection loss after 2 seconds
      setTimeout(() => {
        console.log('Simulating connection loss...');
        ws.terminate();
      }, 2000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`Connection closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
      
      // Attempt to reconnect
      reconnectAttempts++;
      if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        // Calculate reconnection delay with exponential backoff
        const delay = Math.min(
          30000, // Maximum delay of 30 seconds
          1000 * Math.pow(2, reconnectAttempts - 1) // Exponential backoff
        );
        
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(connect, delay);
      } else {
        console.log('Maximum reconnection attempts reached');
      }
    });
  }
  
  // Start the first connection
  connect();
  
  // Run the test for a while
  await new Promise(resolve => setTimeout(resolve, 60000));
}

// Run the test
testReconnection().then(() => {
  console.log('Test completed');
});
