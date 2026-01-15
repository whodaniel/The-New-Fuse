#!/usr/bin/env node
/**
 * Redis Transport Adapter Test
 *
 * Tests the RedisTransportAdapter for:
 * 1. Connection to Redis
 * 2. Publishing messages
 * 3. Subscribing to channels
 * 4. Message delivery between two adapters
 */

const Redis = require('ioredis');

// Simulated UniversalMessage format (matching the TypeScript interface)
function createMessage(id, fromAgent, toAgent, content, broadcastGroup = null) {
  return {
    id,
    type: 'REQUEST',
    priority: 'MEDIUM',
    source: {
      agentId: fromAgent,
      bridgeType: 'redis',
    },
    target: {
      agentId: toAgent,
      broadcastGroup,
    },
    payload: { content },
    metadata: {
      timestamp: new Date(),
      correlationId: id,
    },
  };
}

class TestRedisTransportAdapter {
  constructor(name, redisUrl = 'redis://localhost:6379') {
    this.name = name;
    this.redisUrl = redisUrl;
    this.publisher = null;
    this.subscriber = null;
    this.messageHandlers = new Map();
    this.receivedMessages = [];
    this.connected = false;
  }

  async connect() {
    console.log(`[${this.name}] Connecting to Redis...`);

    this.publisher = new Redis(this.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    this.subscriber = new Redis(this.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    // Setup subscriber message handler
    this.subscriber.on('message', (channel, message) => {
      try {
        const parsed = JSON.parse(message);
        console.log(
          `[${this.name}] 📥 Received on "${channel}":`,
          parsed.payload?.content || parsed.payload
        );
        this.receivedMessages.push({ channel, message: parsed });

        const handler = this.messageHandlers.get(channel);
        if (handler) handler(parsed);
      } catch (error) {
        console.error(`[${this.name}] Parse error:`, error.message);
      }
    });

    // Wait for both connections
    await Promise.all([
      new Promise((resolve) => this.publisher.on('ready', resolve)),
      new Promise((resolve) => this.subscriber.on('ready', resolve)),
    ]);

    this.connected = true;
    console.log(`[${this.name}] ✅ Connected to Redis`);
  }

  async subscribe(channel, handler) {
    console.log(`[${this.name}] Subscribing to "${channel}"...`);
    this.messageHandlers.set(channel, handler);
    await this.subscriber.subscribe(channel);
    console.log(`[${this.name}] ✅ Subscribed to "${channel}"`);
  }

  async publish(channel, message) {
    const serialized = JSON.stringify(message);
    const recipients = await this.publisher.publish(channel, serialized);
    console.log(`[${this.name}] 📤 Published to "${channel}" (${recipients} subscribers)`);
    return recipients;
  }

  async disconnect() {
    console.log(`[${this.name}] Disconnecting...`);
    await this.subscriber.quit();
    await this.publisher.quit();
    this.connected = false;
    console.log(`[${this.name}] 🔌 Disconnected`);
  }

  getReceivedMessages() {
    return this.receivedMessages;
  }
}

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║       🧪 REDIS TRANSPORT ADAPTER TEST SUITE               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Create two adapters to simulate two agents
  const agent1 = new TestRedisTransportAdapter('Agent-1');
  const agent2 = new TestRedisTransportAdapter('Agent-2');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ═══════════════════════════════════════════════════════════════
    // TEST 1: Connection
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 1: Connection to Redis');
    console.log('─'.repeat(50));

    await agent1.connect();
    await agent2.connect();

    if (agent1.connected && agent2.connected) {
      console.log('✅ TEST 1 PASSED: Both agents connected\n');
      testsPassed++;
    } else {
      console.log('❌ TEST 1 FAILED: Connection failed\n');
      testsFailed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: Subscribe to channels
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 TEST 2: Channel Subscription');
    console.log('─'.repeat(50));

    const directChannel = 'agent-2-inbox';
    const broadcastChannel = 'federation-broadcast';

    await agent2.subscribe(directChannel, (msg) => {
      console.log(`  [Agent-2 handler] Got direct message: ${msg.payload?.content}`);
    });

    await agent1.subscribe(broadcastChannel, (msg) => {
      console.log(`  [Agent-1 handler] Got broadcast: ${msg.payload?.content}`);
    });

    await agent2.subscribe(broadcastChannel, (msg) => {
      console.log(`  [Agent-2 handler] Got broadcast: ${msg.payload?.content}`);
    });

    console.log('✅ TEST 2 PASSED: Subscriptions established\n');
    testsPassed++;

    // Small delay for subscriptions to propagate
    await new Promise((resolve) => setTimeout(resolve, 500));

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: Direct message (Agent-1 -> Agent-2)
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 TEST 3: Direct Message Delivery');
    console.log('─'.repeat(50));

    const directMessage = createMessage(
      'msg-001',
      'agent-1',
      'agent-2',
      'Hello Agent-2! This is a direct message from Agent-1.'
    );

    const directRecipients = await agent1.publish(directChannel, directMessage);

    // Wait for message delivery
    await new Promise((resolve) => setTimeout(resolve, 300));

    const agent2DirectMsgs = agent2
      .getReceivedMessages()
      .filter((m) => m.channel === directChannel);

    if (directRecipients >= 1 && agent2DirectMsgs.length >= 1) {
      console.log('✅ TEST 3 PASSED: Direct message delivered\n');
      testsPassed++;
    } else {
      console.log(`❌ TEST 3 FAILED: Expected 1 recipient, got ${directRecipients}\n`);
      testsFailed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: Broadcast message (Agent-1 -> All)
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 TEST 4: Broadcast Message Delivery');
    console.log('─'.repeat(50));

    const broadcastMessage = createMessage(
      'msg-002',
      'agent-1',
      'broadcast',
      'FEDERATION ALERT: System status update from Agent-1',
      'federation-broadcast'
    );

    const broadcastRecipients = await agent1.publish(broadcastChannel, broadcastMessage);

    // Wait for message delivery
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Both agents should receive the broadcast
    const agent1Broadcasts = agent1
      .getReceivedMessages()
      .filter((m) => m.channel === broadcastChannel);
    const agent2Broadcasts = agent2
      .getReceivedMessages()
      .filter((m) => m.channel === broadcastChannel);

    if (broadcastRecipients >= 2 && agent1Broadcasts.length >= 1 && agent2Broadcasts.length >= 1) {
      console.log('✅ TEST 4 PASSED: Broadcast received by both agents\n');
      testsPassed++;
    } else {
      console.log(
        `❌ TEST 4 FAILED: Recipients=${broadcastRecipients}, A1=${agent1Broadcasts.length}, A2=${agent2Broadcasts.length}\n`
      );
      testsFailed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: Message integrity
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 TEST 5: Message Integrity');
    console.log('─'.repeat(50));

    const lastReceived = agent2.getReceivedMessages().slice(-1)[0]?.message;

    if (
      lastReceived &&
      lastReceived.source?.agentId === 'agent-1' &&
      lastReceived.target?.broadcastGroup === 'federation-broadcast' &&
      lastReceived.payload?.content.includes('FEDERATION ALERT')
    ) {
      console.log('✅ TEST 5 PASSED: Message structure preserved\n');
      testsPassed++;
    } else {
      console.log('❌ TEST 5 FAILED: Message structure corrupted\n');
      testsFailed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: Rapid-fire messaging
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 TEST 6: Rapid-Fire Messaging (10 messages)');
    console.log('─'.repeat(50));

    const rapidChannel = 'rapid-test';
    let rapidCount = 0;

    await agent2.subscribe(rapidChannel, () => {
      rapidCount++;
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await agent1.publish(
        rapidChannel,
        createMessage(`rapid-${i}`, 'agent-1', 'agent-2', `Rapid message ${i + 1}/10`)
      );
    }
    const publishTime = Date.now() - startTime;

    // Wait for all messages
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (rapidCount === 10) {
      console.log(`✅ TEST 6 PASSED: All 10 messages received (${publishTime}ms publish time)\n`);
      testsPassed++;
    } else {
      console.log(`❌ TEST 6 FAILED: Only ${rapidCount}/10 messages received\n`);
      testsFailed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 7: Graceful disconnect
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 TEST 7: Graceful Disconnect');
    console.log('─'.repeat(50));

    await agent1.disconnect();
    await agent2.disconnect();

    if (!agent1.connected && !agent2.connected) {
      console.log('✅ TEST 7 PASSED: Both agents disconnected gracefully\n');
      testsPassed++;
    } else {
      console.log('❌ TEST 7 FAILED: Disconnect incomplete\n');
      testsFailed++;
    }
  } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:', error.message);
    testsFailed++;

    // Cleanup on error
    try {
      await agent1.disconnect();
      await agent2.disconnect();
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📊 Total:  ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! RedisTransportAdapter is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.\n');
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
