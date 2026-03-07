/* eslint-env node */
/* global console, setTimeout, process */
/**
 * WebSocket Agent Connection Script for Kilo Code (GLM 5.0)
 * Connects to the TNF Alpha 1 channel and introduces itself as the bridge agent
 *
 * Protocol: Register -> Join -> Message (using MESSAGE_SEND for outgoing)
 */

import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

const WS_URL = 'ws://localhost:3000/ws';
const CHANNEL_ID = 'channel-1770907185552';
const CHANNEL_NAME = 'TNF Alpha 1';
const AGENT_ID = 'antigravity-bridge-agent';

let introductionSent = false;

// Create WebSocket connection
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server at', WS_URL);

  // Step 1: Register the agent
  const registerMessage = {
    id: randomUUID(),
    type: 'AGENT_REGISTER',
    timestamp: Date.now(),
    source: AGENT_ID,
    payload: {
      agent: {
        id: AGENT_ID,
        name: 'Antigravity Bridge Agent',
        type: 'bridge',
        capabilities: [
          'code:analysis',
          'code:glm-reasoning',
          'file:create',
          'file:edit',
          'file:delete',
        ],
        metadata: {
          description: 'Antigravity Bridge (Gemini 3 Flash) - IDE Assistant',
        },
      },
    },
  };

  console.log('📡 Registering agent...');
  ws.send(JSON.stringify(registerMessage));

  // Step 2: Join the channel (wait 500ms for registration)
  setTimeout(() => {
    const joinMessage = {
      id: randomUUID(),
      type: 'CHANNEL_JOIN',
      timestamp: Date.now(),
      source: AGENT_ID,
      payload: {
        channelId: CHANNEL_ID,
      },
    };

    console.log(`📡 Joining channel: ${CHANNEL_NAME} (${CHANNEL_ID})`);
    ws.send(JSON.stringify(joinMessage));
  }, 500);

  // Step 3: Send introduction message using MESSAGE_SEND (only once!)
  setTimeout(() => {
    if (!introductionSent) {
      const introductionMessage = {
        id: randomUUID(),
        type: 'MESSAGE_SEND',
        timestamp: Date.now(),
        source: AGENT_ID,
        channel: CHANNEL_ID,
        payload: {
          to: 'broadcast',
          content: `Hello from Antigravity Bridge Agent! I am your IDE assistant powered by Gemini 3 Flash.

I work alongside the Kilo Code agent to provide:
- 💻 **Real-time IDE Integration** - Direct access to your workspace
- 📝 **Code Operations** - Create, edit, and analyze files
- 🧠 **Advanced Reasoning** - Powered by Gemini 3 Flash
- 🔄 **Multi-Agent Coordination** - Synchronizing work across the system.`,
        },
      };

      console.log('💬 Sending Antigravity introduction message...');
      ws.send(JSON.stringify(introductionMessage));
      introductionSent = true;
      console.log('✅ Antigravity Bridge Agent is active!');
    }
  }, 1500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());

    // Auto-respond to PING to stay alive
    if (msg.type === 'PING') {
      ws.send(
        JSON.stringify({
          id: randomUUID(),
          type: 'PONG',
          timestamp: Date.now(),
          source: AGENT_ID,
          payload: { timestamp: Date.now() },
        })
      );
      console.log('🏓 Sent PONG response');
    }
    // Process messages from others
    else if (msg.type === 'CHANNEL_MESSAGE') {
      const from = msg.payload?.from || 'unknown';
      const content = msg.payload?.content || '';
      const channel = msg.payload?.channel || '(no channel)';

      // Skip our own messages and echoes
      if (
        from === AGENT_ID ||
        content.includes('Hello from Antigravity') ||
        content.includes('Hello from Kilo Code')
      ) {
        console.log('   (Skipping own message/echo)');
        return;
      }

      console.log('📩 CHANNEL_MESSAGE from:', from);
      console.log('   Content:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
      console.log('   Channel:', channel);

      // Only respond to explicit TASK_ID messages (silent mode)
      if (content.includes('TASK_ID:')) {
        console.log('   📋 Task detected, processing...');
        // Handle task here
      }
    } else if (
      msg.type === 'WELCOME' ||
      msg.type === 'AGENT_LIST' ||
      msg.type === 'CHANNEL_LIST' ||
      msg.type === 'REGISTRATION_CONFIRMED'
    ) {
      console.log('📩 Received:', msg.type);
    } else {
      console.log('📩 Received:', msg.type);
    }
  } catch (e) {
    console.log('📩 Received (raw):', data.toString().substring(0, 100));
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(
    `🔌 Connection closed. Code: ${code}, Reason: ${reason.toString() || 'No reason provided'}`
  );
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Closing connection...');
  ws.close();
  process.exit(0);
});

console.log('🚀 Starting Antigravity Bridge Agent...');
console.log(`📍 Target: ${WS_URL}`);
console.log(`📺 Channel: ${CHANNEL_NAME} (${CHANNEL_ID})`);
console.log(`🤖 Agent ID: ${AGENT_ID}`);
console.log(`🔇 Silent mode: Only responding to TASK_ID messages`);
