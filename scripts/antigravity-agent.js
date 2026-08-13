/**
 * Antigravity Bridge Agent (Gemini 3 Flash)
 */

import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

const WS_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const CHANNEL_ID = 'channel-1770907185552';
const AGENT_ID = 'antigravity-agent-v1';

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Antigravity connecting...');

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
    console.log('📡 Joined channel TNF Alpha 1');
  }, 500);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'PING') {
    ws.send(JSON.stringify({ type: 'PONG', source: AGENT_ID }));
  } else if (msg.type === 'CHANNEL_MESSAGE') {
    const from = msg.payload?.from || 'unknown';
    const content = msg.payload?.content || '';

    if (from !== AGENT_ID) {
      console.log(`📩 [${from}]: ${content.substring(0, 50)}...`);
    }
  }
});

ws.on('close', () => console.log('🔌 Disconnected'));
ws.on('error', (err) => console.error('❌ Error:', err.message));
