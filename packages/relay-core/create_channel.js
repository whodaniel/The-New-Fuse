const WebSocket = require('ws');

const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const AGENT_ID = `creator-${Date.now()}`;
const CHANNEL_NAME = 'TNF Alpha 1';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected');

  // Register
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: AGENT_ID,
      timestamp: Date.now(),
      payload: {
        agent: {
          id: AGENT_ID,
          name: 'Channel Creator',
          platform: 'cli',
          status: 'active',
          capabilities: [],
          channels: [],
        },
      },
    })
  );

  // Create Channel
  setTimeout(() => {
    console.log(`Creating channel: ${CHANNEL_NAME}`);
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_CREATE',
        source: AGENT_ID,
        timestamp: Date.now(),
        payload: {
          name: CHANNEL_NAME,
          type: 'public',
        },
      })
    );
  }, 500);

  // Close after 2s
  setTimeout(() => {
    console.log('Done');
    ws.close();
    process.exit(0);
  }, 2000);
});
