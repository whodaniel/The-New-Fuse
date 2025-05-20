// Test script for WebSocket authentication
const WebSocket = require('ws');

// Configuration
const WS_HOST = 'localhost';
const WS_PORT = 3710;
const WS_URL = `ws://${WS_HOST}:${WS_PORT}`;

// Test authentication
async function testAuthentication() {
  console.log('Testing WebSocket authentication...');
  
  // Test 1: Connect without a token
  console.log('\n--- Test 1: Connect without a token ---');
  await testNoToken();
  
  // Test 2: Connect with a valid token
  console.log('\n--- Test 2: Connect with a valid token ---');
  const tokenInfo = await testGetToken();
  
  if (tokenInfo) {
    // Test 3: Connect with the token
    console.log('\n--- Test 3: Connect with the token ---');
    await testWithToken(tokenInfo.token);
    
    // Test 4: Test token refresh
    console.log('\n--- Test 4: Test token refresh ---');
    await testTokenRefresh(tokenInfo.refreshToken);
    
    // Test 5: Test token expiration
    console.log('\n--- Test 5: Test token expiration ---');
    await testTokenExpiration(tokenInfo.token);
  }
}

// Test connecting without a token
async function testNoToken() {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      
      // Send authentication message without token
      const authMessage = {
        type: 'AUTH'
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('Sent authentication message without token');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message);
        
        if (message.type === 'ERROR') {
          console.log('Authentication failed as expected');
          ws.close();
          resolve();
        } else if (message.type === 'AUTH_RESPONSE') {
          console.log('Authentication succeeded (authentication might be disabled)');
          ws.close();
          resolve();
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      resolve();
    });
    
    ws.on('close', () => {
      console.log('Connection closed');
      resolve();
    });
    
    // Set a timeout
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        resolve();
      }
    }, 5000);
  });
}

// Test getting a token
async function testGetToken() {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    let tokenInfo = null;
    
    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      
      // Send authentication message to get a token
      const authMessage = {
        type: 'AUTH'
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('Sent authentication message to get a token');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message type:', message.type);
        
        if (message.type === 'AUTH_RESPONSE') {
          console.log('Received token:', message.token ? message.token.substring(0, 10) + '...' : 'No token');
          console.log('Token expires at:', message.expiresAt ? new Date(message.expiresAt).toLocaleString() : 'No expiration');
          console.log('Refresh token:', message.refreshToken ? message.refreshToken.substring(0, 10) + '...' : 'No refresh token');
          
          tokenInfo = {
            token: message.token,
            expiresAt: message.expiresAt,
            refreshToken: message.refreshToken
          };
          
          ws.close();
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      resolve(null);
    });
    
    ws.on('close', () => {
      console.log('Connection closed');
      resolve(tokenInfo);
    });
    
    // Set a timeout
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        resolve(tokenInfo);
      }
    }, 5000);
  });
}

// Test connecting with a token
async function testWithToken(token) {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      
      // Send authentication message with token
      const authMessage = {
        type: 'AUTH',
        token
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('Sent authentication message with token');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message type:', message.type);
        
        if (message.type === 'SYSTEM') {
          console.log('Authentication succeeded, received welcome message');
          
          if (message.auth) {
            console.log('Authentication info:');
            console.log('- Enabled:', message.auth.enabled);
            console.log('- Require Auth:', message.auth.requireAuth);
            console.log('- Token Expires At:', message.auth.tokenExpiresAt ? new Date(message.auth.tokenExpiresAt).toLocaleString() : 'No expiration');
          }
          
          ws.close();
        } else if (message.type === 'ERROR') {
          console.log('Authentication failed:', message.message);
          ws.close();
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      resolve();
    });
    
    ws.on('close', () => {
      console.log('Connection closed');
      resolve();
    });
    
    // Set a timeout
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        resolve();
      }
    }, 5000);
  });
}

// Test token refresh
async function testTokenRefresh(refreshToken) {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      
      // Send refresh token message
      const refreshMessage = {
        type: 'AUTH',
        refreshToken
      };
      
      ws.send(JSON.stringify(refreshMessage));
      console.log('Sent refresh token message');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message type:', message.type);
        
        if (message.type === 'AUTH_REFRESH') {
          console.log('Token refresh succeeded');
          console.log('New token:', message.token ? message.token.substring(0, 10) + '...' : 'No token');
          console.log('New token expires at:', message.expiresAt ? new Date(message.expiresAt).toLocaleString() : 'No expiration');
          console.log('New refresh token:', message.refreshToken ? message.refreshToken.substring(0, 10) + '...' : 'No refresh token');
          
          ws.close();
        } else if (message.type === 'ERROR') {
          console.log('Token refresh failed:', message.message);
          ws.close();
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      resolve();
    });
    
    ws.on('close', () => {
      console.log('Connection closed');
      resolve();
    });
    
    // Set a timeout
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        resolve();
      }
    }, 5000);
  });
}

// Test token expiration
async function testTokenExpiration(token) {
  console.log('Token expiration test requires manual verification:');
  console.log('1. Check the token expiration time in the VS Code settings');
  console.log('2. Set the token expiration to a short value (e.g., 10000 ms = 10 seconds)');
  console.log('3. Run this test again and wait for the token to expire');
  console.log('4. Try to use the token after it has expired');
  
  console.log('\nToken:', token ? token.substring(0, 10) + '...' : 'No token');
}

// Run the tests
testAuthentication().then(() => {
  console.log('\nTests completed');
});
