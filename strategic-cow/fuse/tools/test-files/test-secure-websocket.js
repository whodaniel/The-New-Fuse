// Test script for secure WebSocket connection
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const WS_HOST = 'localhost';
const WS_PORT = 3710;
const WS_URL = `ws://${WS_HOST}:${WS_PORT}`;
const WSS_URL = `wss://${WS_HOST}:${WS_PORT}`;

// Test both secure and non-secure connections
async function testConnections() {
  console.log('Testing WebSocket connections...');
  
  // Test non-secure connection
  console.log('\n--- Testing non-secure connection (ws://) ---');
  await testConnection(WS_URL);
  
  // Test secure connection
  console.log('\n--- Testing secure connection (wss://) ---');
  await testConnection(WSS_URL);
}

// Test a single connection
async function testConnection(url) {
  return new Promise((resolve) => {
    console.log(`Connecting to ${url}...`);
    
    const ws = new WebSocket(url, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    // Set a timeout
    const timeout = setTimeout(() => {
      console.log(`Connection to ${url} timed out`);
      ws.terminate();
      resolve(false);
    }, 5000);
    
    ws.on('open', () => {
      console.log(`Connected to ${url} successfully`);
      
      // Send authentication message
      const authMessage = {
        type: 'AUTH',
        token: 'test-token'
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('Sent authentication message');
      
      // Wait for a response
      setTimeout(() => {
        ws.close();
        clearTimeout(timeout);
        resolve(true);
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
      console.error(`Error connecting to ${url}:`, error.message);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`Connection to ${url} closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    });
  });
}

// Run the tests
testConnections().then(() => {
  console.log('\nTests completed');
});
