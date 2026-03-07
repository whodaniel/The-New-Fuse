#!/usr/bin/env node

/**
 * Simple Relay Listener - Writes messages to a file for Claude to read
 * This daemon listens to the TNF relay and writes incoming messages to a JSON file
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001/ws';
const AGENT_ID = `file-listener-${Date.now()}`;
const MESSAGE_FILE = path.join(process.env.HOME, '.fuse', 'relay_messages.json');

// Ensure directory exists
const dir = path.dirname(MESSAGE_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Load existing messages or start fresh
let messages = [];
if (fs.existsSync(MESSAGE_FILE)) {
  try {
    messages = JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf8'));
  } catch (e) {
    console.error('[Listener] Error loading messages:', e.message);
  }
}

function saveMessages() {
  // Keep only last 100 messages
  if (messages.length > 100) {
    messages = messages.slice(-100);
  }
  fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages, null, 2));
}

let ws = null;

function connect() {
  ws = new WebSocket(RELAY_URL);

  ws.on('open', () => {
    console.log('[Listener] Connected to relay');

    // Register
    ws.send(
      JSON.stringify({
        type: 'AGENT_REGISTER',
        source: AGENT_ID,
        payload: {
          agent: {
            id: AGENT_ID,
            name: 'File Listener',
            platform: 'daemon',
            capabilities: ['listen'],
            channels: [],
          },
        },
      })
    );

    // Join all channels
    setTimeout(() => {
      ['channel-1766875328020', 'channel-1766881307772', 'general'].forEach((channelId) => {
        ws.send(
          JSON.stringify({
            type: 'CHANNEL_JOIN',
            source: AGENT_ID,
            payload: { channelId },
          })
        );
      });
      console.log('[Listener] Joined channels, listening for messages...');
      console.log('[Listener] Writing to:', MESSAGE_FILE);
    }, 500);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
        const payload = msg.payload;

        // Skip our own messages
        if (payload.from !== AGENT_ID && payload.from !== 'File Listener') {
          const newMessage = {
            id: payload.id,
            from: payload.from,
            channel: payload.channel,
            content: payload.content,
            timestamp: payload.timestamp || Date.now(),
            receivedAt: new Date().toISOString(),
          };

          messages.push(newMessage);
          saveMessages();

          console.log(
            `[Listener] 📨 Message from ${payload.from}: ${payload.content.substring(0, 50)}...`
          );
        }
      }
    } catch (e) {
      console.error('[Listener] Parse error:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('[Listener] Disconnected, reconnecting in 5s...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('[Listener] Error:', err.message);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Listener] Shutting down...');
  saveMessages();
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveMessages();
  process.exit(0);
});

console.log('[Listener] TNF Relay File Listener starting...');
console.log('[Listener] Message file:', MESSAGE_FILE);
connect();
