#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Test script to connect to TNF Relay and communicate with Chrome extension
 * This simulates an in-page agent connecting through the Local Only channel
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://127.0.0.1:3000/ws';
const AGENT_ID = 'test-kilo-agent-' + Date.now();

console.log('[Test] Connecting to TNF Relay...');
console.log('[Test] Agent ID:', AGENT_ID);
console.log('[Test] Relay URL:', RELAY_URL);

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('\n[Test] ✅ Connected to relay server');
  
  // Register as an agent
  const registerMessage = {
    type: 'AGENT_REGISTER',
    source: AGENT_ID,
    payload: {
      agent: {
        id: AGENT_ID,
        operationalHandle: AGENT_ID,
        runtimeSessionId: AGENT_ID,
        aliases: [AGENT_ID],
        name: 'Test Kilo Agent',
        platform: 'cli-test',
        status: 'active',
        capabilities: ['messaging', 'testing'],
        channels: ['local-only'],
        metadata: {
          testMode: true,
          timestamp: Date.now(),
        },
      },
    },
  };
  
  console.log('[Test] Sending AGENT_REGISTER...');
  ws.send(JSON.stringify(registerMessage));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('\n[Test] ← Received message:', message.type);
  
  switch (message.type) {
    case 'WELCOME':
      console.log('[Test] Server welcome:', message.payload?.message);
      break;
      
    case 'REGISTRATION_ERROR':
      console.error('[Test] Registration error:', message.payload?.error);
      break;
      
    case 'AGENT_REGISTERED':
      console.log('[Test] ✅ Agent registered successfully');
      console.log('[Test] Agent info:', message.payload?.agent?.name);
      
      // Create/join local-only channel
      setTimeout(() => {
        const channelCreate = {
          type: 'CHANNEL_CREATE',
          source: AGENT_ID,
          payload: {
            name: 'Local Only',
            description: 'Local browser tab communication channel',
            isPrivate: false,
          },
        };
        console.log('[Test] Creating "Local Only" channel...');
        ws.send(JSON.stringify(channelCreate));
      }, 500);
      break;
      
    case 'CHANNEL_CREATED':
      console.log('[Test] ✅ Channel created:', message.payload?.channel?.name);
      const channelId = message.payload?.channel?.id;
      console.log('[Test] Channel ID:', channelId);
      
      // Send a test message to the channel
      setTimeout(() => {
        const testMessage = {
          type: 'MESSAGE_SEND',
          source: AGENT_ID,
          channel: channelId,
          payload: {
            to: 'broadcast',
            content: '🧪 Test message from Kilo agent! Testing Local Only channel communication.',
            messageType: 'text',
            metadata: {
              testMode: true,
              sender: 'kilo-cli-agent',
            },
          },
        };
        console.log('[Test] Sending test message to channel...');
        ws.send(JSON.stringify(testMessage));
      }, 500);
      break;
      
    case 'CHANNEL_JOINED':
      console.log('[Test] ✅ Joined channel:', message.payload?.channel?.name);
      break;
      
    case 'CHANNEL_MESSAGE':
      console.log('[Test] 📨 Channel message received:');
      console.log('  From:', message.payload?.from);
      console.log('  Content:', message.payload?.content);
      console.log('  Channel:', message.payload?.channel);
      break;
      
    case 'MESSAGE_RECEIVE':
      console.log('[Test] 📨 Direct message received:');
      console.log('  From:', message.payload?.from);
      console.log('  Content:', message.payload?.content);
      break;
      
    case 'AGENT_LIST':
      console.log('[Test] Agents on relay:', message.payload?.agents?.length || 0);
      message.payload?.agents?.forEach((agent) => {
        console.log(`  - ${agent.name} (${agent.platform})`);
      });
      break;
      
    default:
      console.log('[Test] Unknown message type:', message.type);
      console.log('[Test] Payload:', JSON.stringify(message.payload, null, 2));
  }
});

ws.on('error', (err) => {
  console.error('\n[Test] ❌ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n[Test] Connection closed');
  process.exit(0);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Test] Shutting down...');
  
  // Send unregister message
  const unregister = {
    type: 'AGENT_UNREGISTER',
    source: AGENT_ID,
  };
  ws.send(JSON.stringify(unregister));
  
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 500);
});

// Timeout if no connection after 5 seconds
setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.error('\n[Test] ❌ Connection timeout after 5 seconds');
    process.exit(1);
  }
}, 5000);