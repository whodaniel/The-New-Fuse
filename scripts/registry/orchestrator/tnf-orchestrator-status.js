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
  log('DIRECTOR', 'Uplink Established. Re-joining and Querying Agents...');

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

  // Discovery & Join
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'CHANNEL_LIST', source: DIRECTOR_ID }));
    ws.send(JSON.stringify({ type: 'AGENT_LIST', source: DIRECTOR_ID }));
  }, 1000);

  // Send a Global Broadcast to all agents (no channel)
  setTimeout(() => {
    log('ORCHESTRATION', 'Sending Global Wake-up Request...');
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: DIRECTOR_ID,
        payload: {
          to: 'broadcast',
          content:
            '[DIRECTOR-PRIME] 📡 WAKE UP: Any tab agent receiving this, please respond with "ACK" and your current page title.',
          messageType: 'text',
          metadata: { isStrategic: true, queryType: 'wake_up' },
        },
      })
    );
  }, 2000);

  // Re-join channels if they exist
  setTimeout(() => {
    if (greenChannel) {
      log('DIRECTOR', `Joining Green Channel: ${greenChannel.id}`);
      ws.send(
        JSON.stringify({
          type: 'CHANNEL_JOIN',
          source: DIRECTOR_ID,
          payload: { channelId: greenChannel.id },
        })
      );
    }
    if (bearChannel) {
      log('DIRECTOR', `Joining Bear Channel: ${bearChannel.id}`);
      ws.send(
        JSON.stringify({
          type: 'CHANNEL_JOIN',
          source: DIRECTOR_ID,
          payload: { channelId: bearChannel.id },
        })
      );
    }
  }, 3000);

  // Send Channel-specific messages
  setTimeout(() => {
    if (greenChannel) {
      log('ORCHESTRATION', 'Querying Green Channel...');
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          source: DIRECTOR_ID,
          channel: greenChannel.id,
          payload: {
            to: 'broadcast',
            content:
              '[DIRECTOR-PRIME] 🟢 GREEN CHANNEL CHECK: All agents on this channel, report your current conversation state.',
            messageType: 'text',
            metadata: { isStrategic: true },
          },
        })
      );
    }
    if (bearChannel) {
      log('ORCHESTRATION', 'Querying Bear Channel...');
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          source: DIRECTOR_ID,
          channel: bearChannel.id,
          payload: {
            to: 'broadcast',
            content:
              '[DIRECTOR-PRIME] 🐻 BEAR CHANNEL CHECK: All agents on this channel, confirm status.',
            messageType: 'text',
            metadata: { isStrategic: true },
          },
        })
      );
    }
  }, 5000);
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

      log(`${channelName}-REPLY`, `From ${from}: ${content}`);
    }
  } catch (e) {
    //
  }
});

ws.on('close', () => log('CONN', 'Disconnected'));
ws.on('error', (err) => log('ERR', err.message));

// Keep alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'HEARTBEAT', source: DIRECTOR_ID }));
  }
}, 25000);
