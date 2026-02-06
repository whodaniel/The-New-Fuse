const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3000/ws';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected to relay');
  
  ws.send(JSON.stringify({
    type: 'AGENT_REGISTER',
    source: 'list-script',
    payload: { agent: { id: 'list-script', name: 'List Script' } }
  }));

  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'CHANNEL_LIST_REQUEST',
      source: 'list-script',
      payload: {}
    }));
  }, 500);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'CHANNEL_LIST') {
    console.log('Channels:', JSON.stringify(msg.payload.channels, null, 2));
    process.exit(0);
  } else {
    console.log('Received:', msg.type);
  }
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 5000);
