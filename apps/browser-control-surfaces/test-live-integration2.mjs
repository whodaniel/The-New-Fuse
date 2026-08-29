import { FederationRelayClient } from './dist/lib/federation-relay-client.js';

console.log('=== Live Integration Test - Join Existing Channel ===\n');

const client = new FederationRelayClient({
  relayUrl: 'ws://127.0.0.1:3000/ws',
  agentId: 'browser-control-surface-test-' + Date.now(),
  platform: 'web-browser',
  provider: 'TNF_NATIVE',
  capabilities: ['federation-channels', 'browser-control', 'terminal-heartbeat'],
  daccRole: 'broker',
  channels: ['general'],  // Use existing channel
  metadata: { test: true },
  autoReconnect: false,
  reconnectAttempts: 0,
});

// Log ALL events
client.on('connected', () => console.log('[EVENT] connected'));
client.on('registered', (data) => console.log('[EVENT] registered:', JSON.stringify(data, null, 2)));
client.on('registration_error', (data) => console.log('[EVENT] registration_error:', JSON.stringify(data, null, 2)));
client.on('disconnected', (data) => console.log('[EVENT] disconnected:', JSON.stringify(data, null, 2)));
client.on('error', (data) => console.log('[EVENT] error:', JSON.stringify(data, null, 2)));
client.on('agents_updated', (data) => console.log('[EVENT] agents_updated:', JSON.stringify(data, null, 2)));
client.on('channels_updated', (data) => console.log('[EVENT] channels_updated:', JSON.stringify(data, null, 2)));
client.on('channel_message', (data) => console.log('[EVENT] channel_message:', JSON.stringify(data, null, 2)));
client.on('agent_left', (data) => console.log('[EVENT] agent_left:', JSON.stringify(data, null, 2)));

async function runTest() {
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected, waiting for registration...\n');
    
    // Wait for registration
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Registration timeout')), 10000);
      client.once('registered', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.once('registration_error', (err) => {
        clearTimeout(timeout);
        reject(new Error('Registration failed: ' + JSON.stringify(err)));
      });
    });
    
    console.log('\nRegistration successful! Testing channel join on "general"...');
    
    const channelId = await client.joinChannel('general');
    console.log('Joined channel:', channelId);
    
    // Send a test message
    await client.sendChannelMessage(channelId, { test: 'hello from browser-control-surface', timestamp: Date.now() });
    console.log('Sent test message');
    
    // Wait a bit for any responses
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\n=== Test Complete ===');
    console.log('Final state:', client.getState());
    
  } catch (err) {
    console.error('\n=== Test Failed ===');
    console.error(err);
  } finally {
    if (client.disconnect) client.disconnect();
    process.exit(0);
  }
}

runTest();
