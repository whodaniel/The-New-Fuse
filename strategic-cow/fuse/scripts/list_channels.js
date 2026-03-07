import WebSocket from 'ws';

const RELAY_URL = 'ws://localhost:3001/ws';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected to Relay');

  // 1. Register
  const registerMsg = {
    type: 'AGENT_REGISTER',
    payload: {
      agentId: 'subagent-channel-lister',
      name: 'ChannelLister',
      capabilities: ['system'],
    },
  };
  ws.send(JSON.stringify(registerMsg));

  // 2. Request Channel List
  setTimeout(() => {
    console.log('Requesting Channel List...');
    ws.send(JSON.stringify({ type: 'CHANNEL_LIST_REQUEST', payload: {} }));
  }, 500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'CHANNEL_LIST') {
      console.log('--- CHANNEL LIST ---');
      console.log(JSON.stringify(msg.payload, null, 2));
      console.log('--------------------');
      ws.close();
      process.exit(0);
    }
  } catch (e) {
    console.error('Error parsing message:', e);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket Error:', err);
  process.exit(1);
});
