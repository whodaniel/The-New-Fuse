#!/usr/bin/env node
/**
 * Orchestrator Script - Join Red Channel and Send Tasks
 * Run with: node orchestrator-red-channel.js
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const ORCHESTRATOR_ID = 'orchestrator-antigravity';
const RED_CHANNEL_ID = 'channel-1768555591302';

console.log('=== Antigravity Orchestrator ===');
console.log(`Connecting to relay at ${RELAY_URL}...`);

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('[✓] Connected to relay');

  // 1. Register as Orchestrator
  ws.send(
    JSON.stringify({
      id: `reg-${Date.now()}`,
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: ORCHESTRATOR_ID,
      payload: {
        agent: {
          id: ORCHESTRATOR_ID,
          name: 'Antigravity Orchestrator',
          platform: 'vscode-ai',
          status: 'active',
          capabilities: ['orchestration', 'task-dispatch', 'coordination'],
          channels: [],
          metadata: { role: 'orchestrator' },
        },
      },
    })
  );
  console.log('[✓] Registered as Antigravity Orchestrator');

  // 2. Join Red Channel
  setTimeout(() => {
    ws.send(
      JSON.stringify({
        id: `join-${Date.now()}`,
        type: 'CHANNEL_JOIN',
        timestamp: Date.now(),
        source: ORCHESTRATOR_ID,
        payload: { channelId: RED_CHANNEL_ID },
      })
    );
    console.log(`[✓] Joined Red channel (${RED_CHANNEL_ID})`);
  }, 300);

  // 3. Send Greeting
  setTimeout(() => {
    const greeting =
      'Hello Red Channel! I am the Antigravity Orchestrator, now online and ready to coordinate multi-agent tasks. Please acknowledge this message.';

    ws.send(
      JSON.stringify({
        id: `msg-${Date.now()}`,
        type: 'MESSAGE_SEND',
        timestamp: Date.now(),
        source: ORCHESTRATOR_ID,
        channel: RED_CHANNEL_ID,
        payload: {
          to: 'broadcast',
          content: greeting,
          messageType: 'text',
          metadata: {
            source: 'orchestrator',
            requiresResponse: true,
          },
        },
      })
    );
    console.log('[✓] Sent greeting to Red channel');
    console.log('\n--- Listening for responses (60 seconds) ---\n');
  }, 600);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
      const from = msg.payload?.from || 'unknown';
      const content = msg.payload?.content || '';

      // Skip our own messages
      if (from === ORCHESTRATOR_ID) return;

      console.log(`[📨 ${from}]: ${content.substring(0, 200)}`);
      if (content.length > 200) console.log('   ... (truncated)');
    } else if (msg.type === 'AGENT_STATUS') {
      const agent = msg.payload?.agent;
      if (agent) {
        console.log(`[👤 Agent Update]: ${agent.name} (${agent.id}) - ${agent.status}`);
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
});

ws.on('error', (err) => {
  console.error('[✗] Connection error:', err.message);
});

ws.on('close', () => {
  console.log('\n[✓] Disconnected from relay');
  process.exit(0);
});

// Stay connected for 60 seconds
setTimeout(() => {
  console.log('\n=== Session complete ===');
  ws.close();
}, 60000);

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n[!] Interrupted - closing connection...');
  ws.close();
  process.exit(0);
});
