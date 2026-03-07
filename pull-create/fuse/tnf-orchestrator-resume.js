const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3000/ws';
const DIRECTOR_ID = 'director-prime';

function log(prefix, msg) {
  console.log(`[${new Date().toLocaleTimeString()}] [${prefix}] ${msg}`);
}

const ws = new WebSocket(RELAY_URL);

let greenChannel = null;
let bearChannel = null;

ws.on('open', () => {
  log('DIRECTOR', 'Uplink Established. Re-initializing Strategic Command...');

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
          capabilities: ['strategic-command', 'agent-onboarding', 'conflict-resolution'],
          channels: [],
        },
      },
    })
  );

  // Create/Join Green Channel
  setTimeout(() => {
    log('DIRECTOR', 'Ensuring Green Channel exists...');
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_CREATE',
        source: DIRECTOR_ID,
        payload: { name: 'Green', description: 'Federated Coordination Channel - Alpha' },
      })
    );
  }, 1000);

  // Create/Join Bear Channel
  setTimeout(() => {
    log('DIRECTOR', 'Ensuring Bear Channel exists...');
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_CREATE',
        source: DIRECTOR_ID,
        payload: { name: 'Bear', description: 'Predator-Class Agent Communication' },
      })
    );
  }, 2000);

  // Discovery
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'CHANNEL_LIST', source: DIRECTOR_ID }));
    ws.send(JSON.stringify({ type: 'AGENT_LIST', source: DIRECTOR_ID }));
  }, 3000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'CHANNEL_CREATED' || msg.type === 'CHANNEL_JOINED') {
      const ch = msg.payload.channel;
      if (ch.name === 'Green') {
        greenChannel = ch;
        log('DIRECTOR', `Green Channel confirmed: ${ch.id}`);
        initiateGreen();
      } else if (ch.name === 'Bear') {
        bearChannel = ch;
        log('DIRECTOR', `Bear Channel confirmed: ${ch.id}`);
        // We will initiate Bear after a delay or after Green response
      }
    }

    if (msg.type === 'CHANNEL_LIST') {
      const channels = msg.payload.channels || [];
      const g = channels.find((c) => c.name === 'Green');
      const b = channels.find((c) => c.name === 'Bear');
      if (g) greenChannel = g;
      if (b) bearChannel = b;
    }

    if (msg.type === 'MESSAGE_RECEIVE' || msg.type === 'CHANNEL_MESSAGE') {
      const payload = msg.payload || {};
      const from = payload.from || msg.source;
      const content = payload.content || '';
      const channelId = msg.channel || payload.channel;

      if (from === DIRECTOR_ID) return;

      const channelName =
        greenChannel && channelId === greenChannel.id
          ? 'GREEN'
          : bearChannel && channelId === bearChannel.id
            ? 'BEAR'
            : 'OTHER';

      log(`${channelName}-REPLY`, `From ${from}: ${content}`);

      // If we get a response from Green, let's initiate Bear if not already started
      if (channelName === 'GREEN' && !bearInitiated) {
        setTimeout(initiateBear, 5000);
      }
    }
  } catch (e) {
    //
  }
});

let greenInitiated = false;
function initiateGreen() {
  if (greenInitiated || !greenChannel) return;
  greenInitiated = true;
  log('ORCHESTRATION', 'Initiating Green Channel Protocol...');
  ws.send(
    JSON.stringify({
      type: 'MESSAGE_SEND',
      source: DIRECTOR_ID,
      channel: greenChannel.id,
      payload: {
        to: 'broadcast',
        content:
          '[DIRECTOR-PRIME] 🟢 GREEN CHANNEL ACTIVATED. Re-registration successful. All agents on this channel, report your current status for federation mapping.',
        messageType: 'text',
        metadata: { isStrategic: true },
      },
    })
  );
}

let bearInitiated = false;
function initiateBear() {
  if (bearInitiated || !bearChannel) return;
  bearInitiated = true;
  log('ORCHESTRATION', 'Initiating Bear Channel Protocol...');
  ws.send(
    JSON.stringify({
      type: 'MESSAGE_SEND',
      source: DIRECTOR_ID,
      channel: bearChannel.id,
      payload: {
        to: 'broadcast',
        content:
          '[DIRECTOR-PRIME] 🐻 BEAR CHANNEL ACTIVATED. All predator-class agents, confirm coordination and visibility of this signal.',
        messageType: 'text',
        metadata: { isStrategic: true },
      },
    })
  );
}

ws.on('close', () => log('CONN', 'Disconnected'));
ws.on('error', (err) => log('ERR', err.message));

// Keep alive
setInterval(() => {
  ws.send(JSON.stringify({ type: 'HEARTBEAT', source: DIRECTOR_ID }));
}, 25000);
