const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3000/ws';

const AGENT_ID = 'antigravity-agent';
const CHANNEL_NAME = 'Alpha 1';

const ws = new WebSocket(RELAY_URL);

let joined = false;

ws.on('open', () => {
  console.log('Connected to relay');

  // Register
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: AGENT_ID,
      payload: {
        agent: {
          id: AGENT_ID,
          name: 'Antigravity',
          platform: 'cli-agent',
          capabilities: ['code-analysis', 'orchestration', 'task-execution'],
        },
      },
    })
  );

  // Create/Join Alpha 1
  setTimeout(() => {
    console.log(`Requesting to join/create channel: ${CHANNEL_NAME}`);
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_CREATE',
        source: AGENT_ID,
        payload: { name: CHANNEL_NAME },
      })
    );
  }, 1000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  // Filter out noisy messages but log others
  if (['WELCOME', 'AGENT_LIST', 'CHANNEL_LIST', 'REGISTRATION_CONFIRMED'].includes(msg.type)) {
    // console.log(`Received ${msg.type}`);
    return;
  }

  console.log('\n--- MESSAGE RECEIVED ---');
  console.log(`Type: ${msg.type}`);
  console.log(`Payload: ${JSON.stringify(msg.payload, null, 2)}`);

  if ((msg.type === 'CHANNEL_JOINED' || msg.type === 'CHANNEL_CREATED') && !joined) {
    const channel = msg.payload.channel;
    if (channel.name === CHANNEL_NAME) {
      joined = true;
      console.log(`Successfully joined ${CHANNEL_NAME} (${channel.id})`);

      // Send greeting
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          source: AGENT_ID,
          channel: channel.id,
          payload: {
            to: 'broadcast',
            content:
              'Hello everyone! Antigravity has joined the Alpha 1 channel. Ready for instructions.',
            messageType: 'text',
          },
        })
      );
    }
  }

  if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
    const content = msg.payload.content;
    const from = msg.payload.from;
    console.log(`[${from}] ${content}`);

    // Potentially auto-respond to "ping"
    if (content.toLowerCase().includes('ping')) {
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          source: AGENT_ID,
          channel: msg.payload.channel,
          payload: {
            to: 'broadcast',
            content: 'PONG!',
            messageType: 'text',
          },
        })
      );
    }
  }
});

ws.on('error', (err) => console.error('WS Error:', err));
ws.on('close', () => console.log('Relay connection closed'));

// Heartbeat
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'HEARTBEAT', source: AGENT_ID }));
  }
}, 30000);
