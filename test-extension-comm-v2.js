#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Test script to communicate with existing Chrome Extension agents on TNF Relay
 * Sends a message to the General channel where the Gemini page agent is active
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://127.0.0.1:3000/ws';
const AGENT_ID = 'kilo-test-agent-' + Date.now();
const TARGET_CHANNEL = 'General'; // The channel where Gemini page agent is connected

console.log('[Test] TNF Relay Communication Test');
console.log('=====================================');
console.log('Agent ID:', AGENT_ID);
console.log('Relay URL:', RELAY_URL);
console.log('Target Channel:', TARGET_CHANNEL);
console.log('');

const ws = new WebSocket(RELAY_URL);
let registeredAgentId = null;

ws.on('open', () => {
  console.log('[Test] ✅ Connected to relay server');
  
  // Register as an agent with minimal config for quick connection
  const registerMessage = {
    type: 'AGENT_REGISTER',
    source: AGENT_ID,
    payload: {
      agent: {
        id: AGENT_ID,
        operationalHandle: AGENT_ID,
        runtimeSessionId: AGENT_ID,
        aliases: [AGENT_ID],
        name: 'Kilo Test Agent',
        platform: 'chrome-extension', // Match platform to auto-approve
        status: 'active',
        capabilities: ['messaging', 'testing'],
        channels: [TARGET_CHANNEL],
        metadata: {
          testMode: true,
          timestamp: Date.now(),
        },
      },
    },
  };
  
  console.log('[Test] → Sending AGENT_REGISTER...');
  ws.send(JSON.stringify(registerMessage));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  switch (message.type) {
    case 'WELCOME':
      console.log('[Test] ← WELCOME:', message.payload?.message);
      break;
      
    case 'REGISTRATION_CONFIRMED':
      registeredAgentId = message.payload?.agentId || AGENT_ID;
      console.log('[Test] ← ✅ REGISTRATION_CONFIRMED');
      console.log('[Test]    Agent ID:', registeredAgentId);
      console.log('[Test]    Source:', message.payload?.source);
      
      // Join the General channel where Gemini is
      setTimeout(() => {
        const joinMessage = {
          type: 'CHANNEL_JOIN',
          source: registeredAgentId,
          payload: {
            channelId: TARGET_CHANNEL,
          },
        };
        console.log('[Test] → Joining channel:', TARGET_CHANNEL);
        ws.send(JSON.stringify(joinMessage));
      }, 300);
      break;
      
    case 'CHANNEL_JOINED':
      console.log('[Test] ← ✅ CHANNEL_JOINED:', message.payload?.channel?.name);
      
      // Send test message to the channel
      setTimeout(() => {
        const testMessage = {
          type: 'MESSAGE_SEND',
          source: registeredAgentId,
          channel: TARGET_CHANNEL,
          payload: {
            to: 'broadcast',
            content: '🧪 Hello from Kilo! Testing Local Only channel communication with Chrome extension. If you receive this, please acknowledge!',
            messageType: 'text',
            metadata: {
              testMode: true,
              sender: 'kilo-cli-agent',
              purpose: 'testing-extension-communication',
            },
          },
        };
        console.log('[Test] → Sending test message to channel...');
        console.log('[Test]    Content:', testMessage.payload.content);
        ws.send(JSON.stringify(testMessage));
      }, 500);
      break;
      
    case 'CHANNEL_MESSAGE':
      console.log('\n[Test] ← 📨 CHANNEL_MESSAGE received:');
      console.log('    From:', message.payload?.from);
      console.log('    Content:', message.payload?.content?.substring(0, 100) + (message.payload?.content?.length > 100 ? '...' : ''));
      console.log('    Channel:', message.payload?.channel);
      console.log('    Timestamp:', new Date(message.payload?.timestamp || Date.now()).toLocaleTimeString());
      break;
      
    case 'MESSAGE_RECEIVE':
      console.log('\n[Test] ← 📨 MESSAGE_RECEIVE:');
      console.log('    From:', message.payload?.from);
      console.log('    Content:', message.payload?.content?.substring(0, 100) + (message.payload?.content?.length > 100 ? '...' : ''));
      break;
      
    case 'AGENT_LIST':
      console.log('\n[Test] ← AGENT_LIST:');
      const agents = message.payload?.agents || [];
      console.log('    Total agents:', agents.length);
      agents.forEach((agent, i) => {
        console.log(`    ${i + 1}. ${agent.name} (${agent.platform}) - Status: ${agent.status}`);
      });
      break;
      
    case 'CHANNEL_LIST':
      console.log('\n[Test] ← CHANNEL_LIST:');
      const channels = message.payload?.channels || [];
      console.log('    Total channels:', channels.length);
      channels.forEach((ch) => {
        const inChannel = ch.members.includes(registeredAgentId || AGENT_ID) ? '✓' : ' ';
        console.log(`    [${inChannel}] ${ch.name} (${ch.members.length} members)`);
      });
      break;
      
    case 'AGENT_STATUS':
      console.log('[Test] ← AGENT_STATUS:', message.payload?.agent?.name, '-', message.payload?.agent?.status);
      break;
      
    case 'BRIDGE_CONNECTED':
      console.log('[Test] ← BRIDGE_CONNECTED for agent:', message.payload?.agentId);
      break;
      
    case 'REGISTRATION_ERROR':
      console.error('[Test] ← ❌ REGISTRATION_ERROR:', message.payload?.error);
      break;
      
    default:
      console.log('[Test] ←', message.type + ':', JSON.stringify(message.payload).substring(0, 200));
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
  
  if (registeredAgentId) {
    const unregister = {
      type: 'AGENT_UNREGISTER',
      source: registeredAgentId,
    };
    ws.send(JSON.stringify(unregister));
  }
  
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 500);
});

// Wait for messages then exit
setTimeout(() => {
  console.log('\n[Test] Test complete - no response received within timeout');
  
  if (registeredAgentId) {
    const unregister = {
      type: 'AGENT_UNREGISTER',
      source: registeredAgentId,
    };
    ws.send(JSON.stringify(unregister));
  }
  
  ws.close();
  process.exit(0);
}, 10000);