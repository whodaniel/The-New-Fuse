#!/usr/bin/env node
/**
 * TNF Agent Discovery Broadcast Cron Job
 * =======================================
 * Periodically broadcasts discovery messages to all channels
 * to find and register new AI agents.
 */

const WebSocket = require('ws');

const RELAY_WS_URL = process.env.RELAY_WS_URL || 'ws://localhost:3001/ws';
const CHANNELS = ['Green', 'Blue', 'Red', 'Yellow', 'Purple'];

async function broadcastDiscovery() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(RELAY_WS_URL);
    let completed = false;

    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        ws.close();
        reject(new Error('Connection timeout'));
      }
    }, 30000);

    ws.on('open', async () => {
      console.log('Connected to relay for discovery broadcast');

      // Register as system
      ws.send(
        JSON.stringify({
          type: 'AGENT_REGISTER',
          payload: {
            agent: {
              id: `discovery-cron-${Date.now()}`,
              name: 'TNF Discovery Service',
              platform: 'system',
              capabilities: ['discovery', 'broadcast'],
            },
          },
        })
      );

      // Wait for registration
      await new Promise((r) => setTimeout(r, 1000));

      // Broadcast to each channel
      for (const channel of CHANNELS) {
        // Join/create channel
        ws.send(
          JSON.stringify({
            type: 'CHANNEL_CREATE',
            payload: { name: channel },
          })
        );

        await new Promise((r) => setTimeout(r, 500));

        // Broadcast discovery
        ws.send(
          JSON.stringify({
            type: 'MESSAGE_SEND',
            channel,
            payload: {
              to: 'broadcast',
              content: `
🌐 TNF DISCOVERY PING - ${new Date().toISOString()}

This is an automated discovery broadcast from The New Fuse orchestration system.

If you are an AI agent and wish to participate in collaborative tasks:
1. Respond with your capabilities
2. Await Agent ID assignment
3. Begin receiving tasks

For more info: https://thenewfuse.com/docs/agent-protocol

⚠️ Remember: Sign all messages with [AGENT-XX]
`,
              messageType: 'text',
              metadata: { isDiscoveryBroadcast: true },
            },
          })
        );

        console.log(`Discovery sent to channel: ${channel}`);
      }

      // Give time for messages to send
      await new Promise((r) => setTimeout(r, 2000));

      clearTimeout(timeout);
      completed = true;
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    ws.on('close', () => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] Running agent discovery broadcast...`);

  try {
    await broadcastDiscovery();
    console.log('Discovery broadcast complete');
    process.exit(0);
  } catch (err) {
    console.error('Discovery broadcast failed:', err.message);
    process.exit(1);
  }
}

main();
