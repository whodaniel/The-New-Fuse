const WebSocket = require('ws');

const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const DIRECTOR_ID = 'director-prime';

function log(prefix, msg) {
  console.log(`[${new Date().toLocaleTimeString()}] [${prefix}] ${msg}`);
}

const ws = new WebSocket(RELAY_URL);

let greenChannel = null;
let bearChannel = null;

ws.on('open', () => {
  log('DIRECTOR', 'Uplink Established. EXECUTING FINAL FEDERATION PROBE...');

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

  // Discovery
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'CHANNEL_LIST', source: DIRECTOR_ID }));
  }, 1000);

  // Global Probe
  setTimeout(() => {
    log('ORCHESTRATION', 'Sending Global Identification Probe...');
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: DIRECTOR_ID,
        payload: {
          to: 'broadcast',
          content:
            '[DIRECTOR-PRIME] 📡 PROBE-001: Identify your Agent ID and the current Goal/Objective discussed in your tab.',
          messageType: 'text',
          metadata: { isStrategic: true, directive: 'identification' },
        },
      })
    );
  }, 3000);

  // Channel Probes
  setTimeout(() => {
    if (greenChannel) {
      log('DIRECTOR', `Joining Green: ${greenChannel.id}`);
      ws.send(
        JSON.stringify({
          type: 'CHANNEL_JOIN',
          source: DIRECTOR_ID,
          payload: { channelId: greenChannel.id },
        })
      );

      setTimeout(() => {
        log('ORCHESTRATION', 'Querying GREEN Channel for Strategic Summary...');
        ws.send(
          JSON.stringify({
            type: 'MESSAGE_SEND',
            source: DIRECTOR_ID,
            channel: greenChannel.id,
            payload: {
              to: 'broadcast',
              content:
                '[DIRECTOR-PRIME-GREEN] 🟢 GREEN STATUS: Summarize the current architecture or code task you are working on.',
              messageType: 'text',
              metadata: { isStrategic: true },
            },
          })
        );
      }, 1000);
    }

    if (bearChannel) {
      log('DIRECTOR', `Joining Bear: ${bearChannel.id}`);
      ws.send(
        JSON.stringify({
          type: 'CHANNEL_JOIN',
          source: DIRECTOR_ID,
          payload: { channelId: bearChannel.id },
        })
      );

      setTimeout(() => {
        log('ORCHESTRATION', 'Querying BEAR Channel for Protocol Status...');
        ws.send(
          JSON.stringify({
            type: 'MESSAGE_SEND',
            source: DIRECTOR_ID,
            channel: bearChannel.id,
            payload: {
              to: 'broadcast',
              content:
                '[DIRECTOR-PRIME-BEAR] 🐻 BEAR STATUS: Confirm active predator protocols and perimeter security state.',
              messageType: 'text',
              metadata: { isStrategic: true },
            },
          })
        );
      }, 2000);
    }
  }, 6000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'CHANNEL_LIST') {
      const channels = msg.payload.channels || [];
      greenChannel = channels.find((c) => c.name === 'Green');
      bearChannel = channels.find((c) => c.name === 'Bear');
    }

    if (
      msg.type === 'MESSAGE_RECEIVE' ||
      msg.type === 'CHANNEL_MESSAGE' ||
      msg.type === 'NEW_MESSAGE'
    ) {
      const payload = msg.payload || {};
      const from = payload.from || msg.source;
      const content = payload.content || '';
      const channelId = msg.channel || payload.channel;

      if (from === DIRECTOR_ID) {
        return;
      }

      const channelName =
        greenChannel && channelId === greenChannel.id
          ? 'GREEN'
          : bearChannel && channelId === bearChannel.id
            ? 'BEAR'
            : channelId === 'general'
              ? 'GENERAL'
              : 'GLOBAL';

      log(`REPLY-${channelName}`, `From ${from}: ${content}`);
    }
  } catch (e) {}
});

ws.on('close', () => log('CONN', 'Disconnected'));
ws.on('error', (err) => log('ERR', err.message));

// Keep alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'HEARTBEAT', source: DIRECTOR_ID }));
  }
}, 25000);
