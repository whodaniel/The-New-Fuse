/**
 * Test Redis-Relay Bridge Flow
 */

const WebSocket = require('ws');
const { createClient } = require('redis');

async function test() {
  console.log('🧪 Starting End-to-End Test...');

  // 1. Setup Redis listener
  const redisSubscriber = createClient({
    url: 'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
  });
  await redisSubscriber.connect();

  let messageReceived = false;

  await redisSubscriber.subscribe('tnf:bus:ingress', (message) => {
    console.log('✅ Received message on tnf:bus:ingress!');
    console.log('Payload:', message);
    messageReceived = true;
    process.exit(0);
  });

  console.log('👂 Listening on Redis channel...');

  // 2. Setup WebSocket client
  const ws = new WebSocket('ws://localhost:3001/ws');
  const agentId = 'tester-' + Date.now();

  ws.on('open', () => {
    console.log('🔌 Connected to Relay');

    // Register
    ws.send(
      JSON.stringify({
        type: 'AGENT_REGISTER',
        source: agentId,
        payload: {
          agent: {
            id: agentId,
            name: 'Tester',
            platform: 'test',
            capabilities: [],
            channels: ['general'],
          },
        },
      })
    );

    // Join channel
    setTimeout(() => {
      ws.send(
        JSON.stringify({ type: 'CHANNEL_JOIN', source: agentId, payload: { channelId: 'general' } })
      );

      // Send test message
      setTimeout(() => {
        const msg = JSON.stringify({
          type: 'MESSAGE_SEND',
          source: agentId,
          channel: 'general',
          payload: { to: 'broadcast', content: 'Testing Redis Bridge', messageType: 'text' },
        });
        ws.send(msg);
        console.log('📤 Sent test message');
      }, 500);
    }, 500);
  });

  // Timeout
  setTimeout(() => {
    if (!messageReceived) {
      console.error('❌ Timeout: No message received on Redis');
      process.exit(1);
    }
  }, 10000);
}

test().catch(console.error);
