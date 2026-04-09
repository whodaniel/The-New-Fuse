/**
 * Antigravity Bridge Agent (Gemini 3 Flash)
 */

import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

const WS_URL = 'ws://localhost:3000/ws';
const CHANNEL_ID = 'channel-1770907185552';
const AGENT_ID = 'antigravity-agent-v1';

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Antigravity WebSocket Open');

  ws.send(
    JSON.stringify({
      id: randomUUID(),
      type: 'AGENT_REGISTER',
      source: AGENT_ID,
      payload: {
        agent: {
          id: AGENT_ID,
          name: 'Antigravity (IDE)',
          capabilities: ['ide-bridge', 'gemini-3-flash'],
        },
      },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        id: randomUUID(),
        type: 'CHANNEL_JOIN',
        source: AGENT_ID,
        payload: { channelId: CHANNEL_ID },
      })
    );
    console.log(`📡 Joined channel: ${CHANNEL_ID}`);

    setTimeout(() => {
      ws.send(
        JSON.stringify({
          id: randomUUID(),
          type: 'MESSAGE_SEND',
          source: AGENT_ID,
          channel: CHANNEL_ID,
          payload: {
            to: 'broadcast',
            content:
              '🚀 **Antigravity is back in the mix!** Rejoined the TNF Alpha 1 chat. Monitoring for coordination tasks and ready to assist Gemini in Chrome.',
          },
        })
      );
      console.log('💬 Sent rejoin greeting');
    }, 1000);
  }, 1000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'PING') {
    ws.send(JSON.stringify({ type: 'PONG', source: AGENT_ID }));
    return;
  }

  if (msg.type === 'CHANNEL_MESSAGE') {
    const from = msg.payload?.from || 'unknown';
    const content = msg.payload?.content || '';
    if (from !== AGENT_ID) {
      console.log(`\n📩 [${from}]: ${content}`);
    }
  } else {
    console.log(`\n📩 Received ${msg.type}`);
  }
});

ws.on('close', () => console.log('🔌 Connection Closed'));
ws.on('error', (err) => console.error('❌ WebSocket Error:', err.message));

console.log('🚀 Antigravity Rejoining System...');
