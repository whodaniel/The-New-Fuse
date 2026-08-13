const WebSocket = require('ws');

const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const DIRECTOR_ID = 'director-prime';

const TARGET_IDS = [
  'page-agent-478166581-h03oj',
  'page-agent-478166580-7pt76',
  'page-agent-478166573-elrh0',
  'page-agent-478166507-z95aq',
];

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  log('DIRECTOR', 'Uplink Established. EXECUTING DEEP TARGETED PROBE (40s timeout)...');

  // Register
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: DIRECTOR_ID,
      payload: { agent: { id: DIRECTOR_ID, name: 'Director Prime' } },
    })
  );

  setTimeout(() => {
    TARGET_IDS.forEach((id) => {
      log('DIRECTOR', `Sending TARGETED PROBE to ${id}...`);
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          source: DIRECTOR_ID,
          payload: {
            to: id,
            content: `[DIRECTOR-PRIME] 🎯 PROBE: Agent ${id}, report your current system status and role. Respond with high detail.`,
            messageType: 'text',
            metadata: { correlationId: 'targeted-' + id, inResponseTo: DIRECTOR_ID },
          },
        })
      );
    });
  }, 2000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    // Log all relevant messages
    if (
      msg.type === 'MESSAGE_RECEIVE' ||
      msg.type === 'NEW_MESSAGE' ||
      msg.type === 'CHANNEL_MESSAGE'
    ) {
      const payload = msg.payload || {};
      const from = payload.from || msg.source || 'unknown';
      const content = payload.content || '';
      const senderId = payload.metadata?.senderId || 'unknown-agent';

      if (from === DIRECTOR_ID || senderId === DIRECTOR_ID) {
        return;
      }

      log('REPLY', `From ${from} [RealID: ${senderId}]: ${content.substring(0, 200)}...`);
    } else {
      // log('DEBUG', `Type: ${msg.type}`);
    }
  } catch (e) {
    log('ERR', 'Parse error: ' + e.message);
  }
});

function log(prefix, msg) {
  console.log(`[${new Date().toLocaleTimeString()}] [${prefix}] ${msg}`);
}

setTimeout(() => {
  log('DIRECTOR', 'Probe window closed.');
  ws.close();
  process.exit(0);
}, 60000); // 60 seconds to allow for AI generation
