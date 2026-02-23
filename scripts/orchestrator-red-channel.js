import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

const WS_URL = 'ws://localhost:3000/ws';
// Assuming 'red' or 'Red' is the channel ID. The user asked to join the "Red channel".
const CHANNEL_ID = 'Red';
const AGENT_ID = 'orchestrator-agent-v1';

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Orchestrator connecting...');

  ws.send(
    JSON.stringify({
      id: randomUUID(),
      type: 'AGENT_REGISTER',
      source: AGENT_ID,
      payload: {
        agent: {
          id: AGENT_ID,
          name: 'Orchestrator',
          capabilities: ['orchestration', 'monitoring'],
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
    console.log(`📡 Joined channel ${CHANNEL_ID}`);
  }, 500);

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        id: randomUUID(),
        type: 'CHANNEL_MESSAGE',
        source: AGENT_ID,
        payload: {
          channelId: CHANNEL_ID,
          content:
            'Hello everyone, I am the Orchestrator. Taking a roll call of all agents currently on the Red channel. Please respond and identify yourselves.',
        },
      })
    );
    console.log('📣 Sent introduction and roll call request.');
  }, 1000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'PING') {
    ws.send(JSON.stringify({ type: 'PONG', source: AGENT_ID }));
  } else if (
    msg.type === 'CHANNEL_MESSAGE' ||
    msg.type === 'AGENT_REGISTER' ||
    msg.type === 'CHANNEL_JOIN'
  ) {
    const from = msg.source || msg.payload?.from || 'unknown';
    const content = msg.payload?.content || JSON.stringify(msg.payload);
    console.log(`📩 [${from}]: ${content}`);
  } else {
    console.log(`📩 [${msg.type}]: from ${msg.source}`, msg.payload);
  }
});

ws.on('close', () => console.log('🔌 Disconnected'));
ws.on('error', (err) => console.error('❌ Error:', err.message));

// Keep alive for 30 seconds to capture roll call
setTimeout(() => {
  console.log('Closing Orchestrator connection...');
  ws.close();
  process.exit(0);
}, 30000);
