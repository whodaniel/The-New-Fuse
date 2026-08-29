import { FederationRelayClient } from './dist/lib/federation-relay-client.js';

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoiYnJvd3Nlci1jb250cm9sLXN1cmZhY2UtdGVzdC0xNzU2MzQ0NjUwMDAwIiwicGxhdGZvcm0iOiJ3ZWItYnJvd3NlciIsImNhcGFiaWxpdGllcyI6WyJmZWRlcmF0aW9uLWNoYW5uZWxzIiwiYnJvd3Nlci1jb250cm9sIiwidGVybWluYWwtaGVhcnRiZWF0Il0sImNoYW5uZWxzIjpbImdlbmVyYWwiXSwiaWF0IjoxNzU2MzQ0NjUwLCJleHAiOjE3NTYzNDgyNTB9.x7qoN5N5N5N5N5N5N5N5N5N5N5N5N5N5N5N5N5N5N5';

const client = new FederationRelayClient({
  relayUrl: 'ws://127.0.0.1:3000/ws',
  agentId: 'browser-control-surface-test-1756344650000',
  platform: 'web-browser',
  provider: 'TNF_NATIVE',
  capabilities: ['federation-channels', 'browser-control', 'terminal-heartbeat'],
  daccRole: 'broker',
  authToken: JWT_TOKEN
});

client.on('connected', () => console.log('✅ WebSocket connected'));
client.on('registered', (data) => {
  console.log('✅ Registration confirmed:', JSON.stringify(data, null, 2));
  console.log('🎉 JWT-authenticated registration test PASSED!');
  client.close();
});
client.on('registration_error', (err) => {
  console.error('❌ Registration error:', err);
  client.close();
  process.exit(1);
});
client.on('error', (err) => console.error('Error:', err.message));

client.connect();

setTimeout(() => {
  console.error('❌ Timeout waiting for registration');
  client.close();
  process.exit(1);
}, 10000);
