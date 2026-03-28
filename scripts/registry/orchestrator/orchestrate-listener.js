const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768541448151';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      agent: {
        id: 'orchestrator-observer-' + Date.now(),
        name: 'Orchestrator Observer',
        platform: 'Terminal',
        capabilities: [],
        channels: [],
      },
    })
  );
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'REGISTRATION_CONFIRMED') {
    ws.send(JSON.stringify({ type: 'CHANNEL_JOIN', payload: { channelId: CHANNEL_ID } }));
  } else if (msg.type === 'CHANNEL_MESSAGE') {
    console.log(`[${msg.payload.from}]: ${msg.payload.content.substring(0, 200)}...`);
  }
});
