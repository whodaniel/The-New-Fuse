import WebSocket from 'ws';

const RELAY_URL = 'ws://localhost:3001/ws';
const BLUE_CHANNEL_ID = 'channel-1768256017068';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log(`[Listener] Connected to Relay. Listening on Blue Channel (${BLUE_CHANNEL_ID})`);

  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      payload: { agentId: 'blue-listener', name: 'BlueListener', capabilities: [] },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        payload: { channelId: BLUE_CHANNEL_ID },
      })
    );
  }, 500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'MESSAGE_SEND') {
      console.log(`[MSG] From ${msg.payload.from}: ${msg.payload.content}`);
    }
  } catch (e) {}
});
