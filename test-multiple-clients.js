// Test script for multiple client support
const WebSocket = require('ws');

// Configuration
const WS_HOST = 'localhost';
const WS_PORT = 3710;
const WS_URL = `ws://${WS_HOST}:${WS_PORT}`;
const NUM_CLIENTS = 3;

// Create multiple client connections
async function testMultipleClients() {
  console.log(`Testing ${NUM_CLIENTS} simultaneous WebSocket connections...`);
  
  const clients = [];
  
  // Create clients
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const clientId = `client-${i + 1}`;
    console.log(`Creating ${clientId}...`);
    
    const ws = new WebSocket(WS_URL, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    ws.on('open', () => {
      console.log(`${clientId} connected successfully`);
      
      // Send authentication message
      const authMessage = {
        type: 'AUTH',
        token: `test-token-${clientId}`
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log(`${clientId} sent authentication message`);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`${clientId} received message:`, message);
      } catch (error) {
        console.error(`${clientId} error parsing message:`, error);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`${clientId} error:`, error.message);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`${clientId} connection closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    });
    
    clients.push({ id: clientId, ws });
  }
  
  // Keep connections open for a while
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Close all connections
  console.log('Closing all connections...');
  for (const client of clients) {
    client.ws.close();
  }
}

// Run the test
testMultipleClients().then(() => {
  console.log('Test completed');
});
