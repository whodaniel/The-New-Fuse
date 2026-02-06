const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3000/ws';

const AGENT_ID = 'antigravity-monitor-fixed';
const CHANNEL_ID = 'channel-1770260372915';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: AGENT_ID,
      payload: { agent: { id: AGENT_ID, name: 'Fixed Monitor' } },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: AGENT_ID,
        payload: { channel: CHANNEL_ID },
      })
    );
  }, 500);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
    console.log(`[${msg.payload.from}] ${msg.payload.content}`);
  }
});

setTimeout(() => {
  process.exit(0);
}, 30000);
