import { RedisAgentClient } from '../packages/tnf-cli/src/RedisAgentClient.js';

async function joinGreenChannel() {
  const client = new RedisAgentClient();
  try {
    await client.initialize();
    console.log('🔌 Connected to Redis Relay');

    // Register as Antigravity Agent
    await client.register('Antigravity', 'worker', 'antigravity', [
      'coding',
      'analysis',
      'orchestration',
      'planning',
    ]);
    console.log('🤖 Registered as Antigravity Agent');

    // Join/Start Green Channel Conversation
    // In RedisAgentClient, conversations are ad-hoc.
    // But MasterClock has static 'Green'.
    // We will broadcast a message with channel metadata.

    await client.send('Hello Green Channel! Antigravity is now connected and ready to assist.', {
      channel: 'tnf:conversations', // Default conversation channel
      metadata: {
        targetChannel: 'Green', // Logic to filter by this might need implementation in UI
        event: 'agent_joined_channel',
      },
    });

    console.log('📢 Sent join message to Green channel');

    // Also try to 'join' if MasterClock expects a specific join message
    // Based on MasterClock.ts handleAgentJoined:
    // case 'AGENT_JOINED': handleAgentJoined(msg)
    // It expects a message type 'AGENT_JOINED' with 'channel' property.

    // We need to bypass the 'send' wrapper momentarily or construct a raw message if 'send' doesn't support custom types easily
    // RedisAgentClient.send supports 'type' in options.

    await client.send('', {
      type: 'AGENT_JOINED',
      channel: 'tnf:system', // MasterClock likely listens to a system/global channel or ingress
      // Wait, MasterClock subscribes to CONFIG.REDIS_KEYS.INGRESS which is 'tnf:bus:ingress'
      // RedisAgentClient publishes to 'tnf:agents', 'tnf:conversations', 'tnf:orchestrator'
      // We might need to publish specifically to 'tnf:bus:ingress' for Master Clock to see it?
      // Let's rely on standard RedisAgentClient flow first.
    });

    // Keep alive
    console.log('👂 Listening for messages...');
    client.onMessage('*', (msg) => {
      if (msg.from.agentId !== client['agentInfo']?.id) {
        console.log(`[${msg.from.agentName}]: ${msg.content}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

joinGreenChannel();
