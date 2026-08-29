import { FederationRelayClient } from './dist/lib/federation-relay-client.js';

const jwt = await import('jsonwebtoken');
const secret = 'test-jwt-secret-for-development-only-32chars-minimum';
const token = jwt.default.sign({
  agentId: 'browser-control-surface-test-1756344650000',
  platform: 'web-browser',
  capabilities: ['federation-channels', 'browser-control', 'terminal-heartbeat'],
  channels: ['general', 'browser-control']
}, secret, { expiresIn: '1h', issuer: 'tnf-relay' });

console.log('Generated token:', token.substring(0, 50) + '...');

const client = new FederationRelayClient({
  relayUrl: 'ws://127.0.0.1:3000/ws',
  agentId: 'browser-control-surface-test-1756344650000',
  platform: 'web-browser',
  provider: 'TNF_NATIVE',
  capabilities: ['federation-channels', 'browser-control', 'terminal-heartbeat'],
  daccRole: 'broker',
  authToken: token
});

client.on('connected', () => console.log('✅ Connected'));
client.on('registered', (data) => {
  console.log('✅ Registration confirmed:', JSON.stringify(data, null, 2));
});
client.on('registration_error', (err) => {
  console.error('❌ Registration error:', err);
});
client.on('agents_updated', (agents) => console.log('📋 Agents updated:', agents.length));
client.on('channels_updated', (channels) => console.log('📋 Channels updated:', channels.length));
client.on('channel_message', (msg) => console.log('📨 Channel message:', msg));
client.on('agent_left', (agent) => console.log('👋 Agent left:', agent));
client.on('error', (err) => console.error('❌ Error:', err));
client.on('close', () => console.log('🔌 Disconnected'));

try {
  await client.connect();
  console.log('Connected, waiting for registration...');
  
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Registration timeout')), 10000);
    client.once('registered', () => {
      clearTimeout(timeout);
      resolve();
    });
    client.once('registration_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
  
  console.log('Registration successful, testing JOIN_CHANNEL...');
  
  const joinResult = await client.joinChannel('general');
  console.log('JOIN_CHANNEL result:', joinResult);
  
  await client.close();
  console.log('✅ Test completed successfully');
} catch (err) {
  console.error('❌ Test failed:', err.message);
  await client.close().catch(() => {});
  process.exit(1);
}
