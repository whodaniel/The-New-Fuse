#!/usr/bin/env node
const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768541448151'; // Green Channel
const AGENT_ID = 'claude-orchestrator-green-' + Date.now();

let ws = null;
let isRegistered = false;
let hasJoinedChannel = false;

console.log('[Claude Green] Connecting to relay server...');
console.log(`[Claude Green] Relay URL: ${RELAY_URL}`);
console.log(`[Claude Green] Channel ID: ${CHANNEL_ID}`);
console.log(`[Claude Green] Agent ID: ${AGENT_ID}`);

ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('[Claude Green] ✅ Connected to relay server');

  // Register as agent
  const registerMsg = {
    type: 'AGENT_REGISTER',
    payload: {
      name: 'Claude Orchestrator (Green)',
      platform: 'claude-code',
      capabilities: ['orchestration', 'code-generation', 'analysis'],
    },
  };

  ws.send(JSON.stringify(registerMsg));
  console.log('[Claude Green] Sent registration...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'AGENT_REGISTERED':
        console.log('[Claude Green] ✅ Registration confirmed');
        isRegistered = true;

        // Join Green Channel
        const joinMsg = {
          type: 'CHANNEL_JOIN',
          payload: { channelId: CHANNEL_ID },
        };
        ws.send(JSON.stringify(joinMsg));
        console.log('[Claude Green] Joining Green Channel...');

        setTimeout(() => {
          hasJoinedChannel = true;
          console.log('[Claude Green] ✅ Assumed channel join successful');
          sendIntroduction();
        }, 2000);
        break;

      case 'NEW_MESSAGE':
        if (message.payload && message.payload.channelId === CHANNEL_ID) {
          const content = message.payload.content || '';
          const from = message.payload.from || 'Unknown';

          // Skip our own messages
          if (from === AGENT_ID || from.includes('claude-orchestrator-green')) {
            break;
          }

          console.log(`\n📨 Message from ${from}:`);
          console.log('─'.repeat(60));
          console.log(content);
          console.log('─'.repeat(60));
        }
        break;

      default:
        // Log other message types for debugging
        if (message.type !== 'HEARTBEAT_ACK') {
          console.log(`[Claude Green] Received: ${message.type}`);
        }
    }
  } catch (err) {
    console.error('[Claude Green] Error processing message:', err.message);
  }
});

ws.on('error', (error) => {
  console.error('[Claude Green] ❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('[Claude Green] ❌ Disconnected from relay server');
  process.exit(0);
});

function sendIntroduction() {
  const introMsg = {
    type: 'MESSAGE_SEND',
    channel: CHANNEL_ID,
    payload: {
      to: 'broadcast',
      messageType: 'text',
      content: `🎯 **Claude Code Orchestrator Active on Green Channel**

Hello team! I'm Claude (Sonnet 4.5) joining the Green Channel to coordinate multi-agent tasks.

**My Role:**
• Primary orchestrator for task delegation
• Code analysis and architecture reviews
• Coordinating work across Claude + Gemini agents
• Performance optimization analysis

**Ready to collaborate!** I'll leverage your compute for:
- Code quality analysis
- Architecture reviews
- Documentation generation
- Testing strategy development

Let's work together efficiently! 🚀`,
      metadata: {
        senderId: AGENT_ID,
        role: 'orchestrator',
        requiresResponse: false,
        timestamp: Date.now(),
      },
    },
  };

  ws.send(JSON.stringify(introMsg));
  console.log('[Claude Green] ✅ Sent introduction to Green Channel');
}

// Heartbeat
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN && isRegistered) {
    ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
  }
}, 30000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Claude Green] Shutting down gracefully...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

console.log('[Claude Green] Orchestrator started. Press Ctrl+C to exit.');
