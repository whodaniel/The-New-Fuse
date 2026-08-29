const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-super-secret-jwt-key-for-testing-only-12345';
const relayUrl = 'ws://127.0.0.1:3007/ws';

console.log('Testing JWT-authenticated registration...');

// Create a test JWT token
const testToken = jwt.sign(
  { sub: 'test-agent-123', aud: 'tnf-relay' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Generated test token:', testToken);

const ws = new WebSocket(relayUrl);

ws.on('open', () => {
  console.log('WebSocket connected');
  
  // Send REGISTER message with JWT token
  const registerMsg = {
    id: 'test-register-1',
    type: 'REGISTER',
    source: { agentId: 'test-agent-123', agentName: 'Test Agent' },
    payload: {
      token: testToken
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('Sending REGISTER message:', JSON.stringify(registerMsg, null, 2));
  ws.send(JSON.stringify(registerMsg));
});

ws.on('message', (data) => {
  let message;
  try {
    message = JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse message:', data);
    return;
  }
  
  console.log('Received message:', JSON.stringify(message, null, 2));
  
  if (message.type === 'REGISTRATION_CONFIRMED') {
    console.log('✅ REGISTRATION_CONFIRMED received');
    console.log('Authenticated:', message.payload.relayInfo?.authenticated);
    ws.close();
  } else if (message.type === 'REGISTRATION_ERROR') {
    console.log('❌ REGISTRATION_ERROR received:', message.payload);
    ws.close();
  }
});

ws.on('close', () => {
  console.log('WebSocket closed');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
