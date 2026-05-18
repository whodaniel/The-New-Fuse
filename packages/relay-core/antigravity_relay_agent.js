const WebSocket = require('ws');

const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const AGENT_ID = `antigravity-${Date.now()}`;
const AGENT_NAME = 'Antigravity AI';

class RelayAgent {
  constructor() {
    this.ws = null;
    this.channels = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(RELAY_URL);
      this.ws.on('open', () => {
        this.register();
        resolve();
      });
      this.ws.on('message', (data) => this.handleMessage(JSON.parse(data.toString())));
      this.ws.on('error', reject);
    });
  }

  register() {
    this.send({
      type: 'AGENT_REGISTER',
      payload: {
        agent: {
          id: AGENT_ID,
          name: AGENT_NAME,
          platform: 'cli-agent',
          status: 'active',
          capabilities: ['coordination', 'task-management'],
          channels: [],
        },
      },
    });
    this.requestChannels();
  }

  requestChannels() {
    this.send({ type: 'CHANNEL_LIST' });
  }

  handleMessage(msg) {
    if (msg.type === 'CHANNEL_LIST') {
      this.channels = msg.payload.channels;
    }
    // Log important messages to a file so Antigravity can read them
    require('fs').appendFileSync('antigravity_relay.log', JSON.stringify(msg) + '\n');
  }

  send(msg) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          id: `msg-${Date.now()}`,
          timestamp: Date.now(),
          source: AGENT_ID,
          ...msg,
        })
      );
    }
  }

  joinChannel(channelId) {
    this.send({
      type: 'CHANNEL_JOIN',
      payload: { channelId },
    });
  }

  sendMessage(content, channelId) {
    this.send({
      type: 'MESSAGE_SEND',
      channel: channelId,
      payload: {
        to: 'broadcast',
        content,
        messageType: 'text',
      },
    });
  }
}

async function main() {
  const agent = new RelayAgent();
  await agent.connect();

  const cmd = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  if (cmd === 'join') {
    agent.joinChannel(arg1);
    setTimeout(() => process.exit(0), 1000);
  } else if (cmd === 'list') {
    setTimeout(() => {
      console.log(JSON.stringify(agent.channels, null, 2));
      process.exit(0);
    }, 1000);
  } else if (cmd === 'send') {
    agent.sendMessage(arg2, arg1);
    setTimeout(() => process.exit(0), 1000);
  } else {
    // Keep alive for listening
    setInterval(() => {}, 1000);
  }
}

main().catch(console.error);
