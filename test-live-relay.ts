import { FederationRelayClient } from './apps/browser-control-surfaces/lib/federation-relay-client';

async function testLiveRelay() {
  console.log('=== Live Relay Integration Test ===\n');

  const client = new FederationRelayClient({
    relayUrl: 'ws://127.0.0.1:3000',
    agentId: 'browser-test-agent',
    platform: 'browser-control-surfaces',
    provider: 'test',
    capabilities: ['test', 'channel-ops'],
    daccRole: 'test-agent',
  });

  // Event listeners
  client.on('connected', () => console.log('✅ Connected to relay'));
  client.on('registered', (data) => console.log('✅ Registered:', JSON.stringify(data, null, 2)));
  client.on('registration_error', (err) => console.error('❌ Registration error:', err));
  client.on('channel_created', (data) => console.log('✅ Channel created:', data));
  client.on('channel_joined', (data) => console.log('✅ Channel joined:', data));
  client.on('channel_message', (msg) => console.log('📨 Channel message:', msg));
  client.on('agents_updated', (agents) => console.log('👥 Agents updated:', agents));
  client.on('channels_updated', (channels) => console.log('📋 Channels updated:', channels));
  client.on('error', (err) => console.error('❌ Error:', err));
  client.on('close', (code, reason) => console.log(`🔌 Connection closed: ${code} - ${reason}`));

  try {
    // Connect
    console.log('🔌 Connecting to ws://127.0.0.1:3000...');
    await client.connect();
    console.log('✅ connect() resolved\n');

    // Wait for registration
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a test channel
    console.log('📝 Creating test channel...');
    await client.createChannel('test-channel', 'Test channel for live integration');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Join the channel
    console.log('📝 Joining test channel...');
    await client.joinChannel('test-channel');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Send a message
    console.log('📝 Sending test message...');
    await client.sendChannelMessage(
      'test-channel',
      JSON.stringify({ type: 'test', content: 'Hello from browser-control-surfaces!' })
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check state
    console.log('\n📊 Client state:', client.getState());

    console.log('\n✅ All live integration tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    // Clean up
    client.emit('close', 1000, 'test complete');
    // The client doesn't have a disconnect method, but we can close the socket
    if ((client as any).socket) {
      (client as any).socket.close();
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('\n🏁 Test complete');
  }
}

testLiveRelay();
