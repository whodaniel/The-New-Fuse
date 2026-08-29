import { FederationRelayClient } from './dist/lib/federation-relay-client.js';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiYnJvd3Nlci1jb250cm9sLXN1cmZhY2UtdGVzdC0xNzU2MzQ0NjUwMDAwIiwicGxhdGZvcm0iOiJ3ZWItYnJvd3NlciIsImNhcGFiaWxpdGllcyI6WyJmZWRlcmF0aW9uLWNoYW5uZWxzIiwiYnJvd3Nlci1jb250cm9sIiwidGVybWluYWwtaGVhcnRiZWF0Il0sImNoYW5uZWxzIjpbImdlbmVyYWwiLCJjb21tYW5kcyJdLCJpYXQiOjE3NTYzNDQ2NTAsImV4cCI6MTc1NjM0ODI1MH0.8Q8ZqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq';

const client = new FederationRelayClient({
  relayUrl: 'ws://127.0.0.1:3000/ws',  // FIXED: relayUrl not url
  agentId: 'browser-control-surface-test-1756344650000',
  name: 'Browser Control Surface Test Agent',
  type: 'browser-control-surface',
  platform: 'web-browser',
  capabilities: ['federation-channels', 'browser-control', 'terminal-heartbeat'],
  channels: ['general', 'commands'],
  metadata: { test: true, authenticated: true },
  authToken: token,
  requestTimeout: 10000,
  heartbeatInterval: 30000,
  reconnectAttempts: 3,
  reconnectDelay: 2000,
});

console.log('=== Starting debug test ===');
console.log('Config relayUrl:', client.config?.relayUrl);
console.log('Config authToken:', client.config?.authToken ? 'SET' : 'NOT SET');

client.on('connected', () => {
  console.log('✅ EVENT: connected');
});

client.on('registered', (data) => {
  console.log('✅ EVENT: registered', JSON.stringify(data, null, 2));
});

client.on('registration_error', (data) => {
  console.log('❌ EVENT: registration_error', JSON.stringify(data, null, 2));
});

client.on('error', (err) => {
  console.log('❌ EVENT: error', err);
});

client.on('close', (code, reason) => {
  console.log('🔌 EVENT: close', code, reason);
});

// Add raw message logging by patching the WebSocket
setTimeout(() => {
  if (client.ws) {
    console.log('=== Patching WebSocket for raw message logging ===');
    const originalOnMessage = client.ws.onmessage;
    client.ws.onmessage = (event) => {
      console.log('📥 RAW RECEIVED:', event.data);
      if (originalOnMessage) originalOnMessage.call(client.ws, event);
    };
    const originalSend = client.ws.send.bind(client.ws);
    client.ws.send = (data) => {
      console.log('📤 RAW SENT:', data);
      return originalSend(data);
    };
  }
}, 100);

try {
  await client.connect();
  console.log('=== connect() returned ===');
  
  // Wait for registration
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('⏰ TIMEOUT waiting for registration');
      reject(new Error('Registration timeout'));
    }, 15000);
    
    client.once('registered', () => {
      clearTimeout(timeout);
      resolve();
    });
    client.once('registration_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
  
  console.log('=== Registration successful! ===');
  
  // Now test channel join
  console.log('=== Testing JOIN_CHANNEL ===');
  const joinResult = await client.joinChannel('general');
  console.log('JOIN_CHANNEL result:', JSON.stringify(joinResult, null, 2));
  
  // Clean up
  client.close();
  console.log('=== Test complete ===');
} catch (err) {
  console.error('❌ Test failed:', err.message);
  console.error(err.stack);
  client.close();
  process.exit(1);
}
