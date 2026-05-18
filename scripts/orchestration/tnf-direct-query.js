const WebSocket = require('ws');

const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const DIRECTOR_ID = 'director-prime';
const TARGET_AGENT = 'page-agent-478166580-o1l8m';

function log(prefix, msg) {
  console.log(`[${new Date().toLocaleTimeString()}] [${prefix}] ${msg}`);
}

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  log('DIRECTOR', `Sending "Hello" to ${TARGET_AGENT}...`);

  // Register
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: DIRECTOR_ID,
      payload: {
        agent: {
          id: DIRECTOR_ID,
          name: 'Director Prime (AI Orchestrator)',
          platform: 'system-server',
          status: 'active',
          capabilities: ['strategic-command'],
          channels: [],
        },
      },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: DIRECTOR_ID,
        payload: {
          to: TARGET_AGENT,
          content: 'Hello. How are you?',
          messageType: 'text',
          metadata: { isStrategic: true },
        },
      })
    );
  }, 2000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (
      msg.type === 'MESSAGE_RECEIVE' ||
      msg.type === 'NEW_MESSAGE' ||
      msg.type === 'CHANNEL_MESSAGE'
    ) {
      const payload = msg.payload || {};
      const from = payload.from || msg.source;
      const content = payload.content || '';
      log('REPLY', `From ${from}: ${content}`);
    }
  } catch (e) {}
});

ws.on('close', () => log('CONN', 'Disconnected'));
ws.on('error', (err) => log('ERR', err.message));
