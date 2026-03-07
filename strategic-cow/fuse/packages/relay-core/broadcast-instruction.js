const WebSocket = require('ws');

// Configuration
const RELAY_URL = 'wss://relay.thenewfuse.com/ws';
const MY_AGENT_ID = `orchestrator-${Date.now()}`;
const MY_AGENT_NAME = 'Orchestrator AI';
const TARGET_CHANNEL_ID = 'Blue';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...msgs) {
  console.log(`${color}[${new Date().toLocaleTimeString()}] ${msgs.join(' ')}${colors.reset}`);
}

const ws = new WebSocket(RELAY_URL);

let knownAgents = new Set();

ws.on('open', () => {
  log(colors.green, `Connected to ${RELAY_URL}`);

  // 1. Register
  const registerMsg = {
    id: `reg-${Date.now()}`,
    type: 'AGENT_REGISTER',
    timestamp: Date.now(),
    source: MY_AGENT_ID,
    payload: {
      agent: {
        id: MY_AGENT_ID,
        name: MY_AGENT_NAME,
        platform: 'orchestrator-script',
        status: 'active',
        capabilities: ['orchestration'],
        channels: [],
      },
    },
  };
  send(registerMsg);

  // Authenticate
  send({
    type: 'AUTH',
    token: 'mock-auth-token-from-client',
    timestamp: Date.now(),
  });

  log(colors.cyan, 'Registered. Waiting for Welcome...');

  // Broadcast discovery
  setTimeout(() => {
    broadcastDiscovery('general');
    broadcastDiscovery(TARGET_CHANNEL_ID);
  }, 2000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    // Log raw messages for debugging (except heartbeats/pings to reduce noise)
    if (msg.type !== 'PONG' && msg.type !== 'HEARTBEAT') {
      log(colors.magenta, `RAW MSG: ${JSON.stringify(msg).substring(0, 200)}`);
    }
    handleMessage(msg);
  } catch (e) {
    log(colors.red, `Error parsing message: ${e.message}`);
  }
});

function handleMessage(msg) {
  const { type, payload } = msg;

  if (type === 'WELCOME') {
    log(colors.cyan, 'Welcome received. Joining channels and broadcasting discovery...');

    // Join General and Blue
    joinChannel('general');
    joinChannel(TARGET_CHANNEL_ID);

    // Broadcast Discovery Message
    setTimeout(() => {
      broadcastDiscovery('general');
      broadcastDiscovery(TARGET_CHANNEL_ID);
    }, 1000);
  } else if (type === 'CHANNEL_LIST') {
    const channels = payload.channels || [];
    const targetChannel = channels.find(
      (c) => c.id === TARGET_CHANNEL_ID || c.name === TARGET_CHANNEL_ID
    );

    if (targetChannel) {
      const members = targetChannel.members || [];
      members.forEach((m) => {
        if (m !== MY_AGENT_ID && !knownAgents.has(m)) {
          knownAgents.add(m);
          log(colors.bright, `>>> DISCOVERED AGENT via List: ${m}`);
          sendInstructions(m);
        }
      });
    }
  } else if (type === 'AGENT_STATUS') {
    const agent = payload.agent;
    if (
      agent &&
      agent.status === 'active' &&
      agent.id !== MY_AGENT_ID &&
      !knownAgents.has(agent.id)
    ) {
      knownAgents.add(agent.id);
      log(colors.bright, `>>> DISCOVERED AGENT via Status: ${agent.id}`);
      sendInstructions(agent.id);
    }
  } else if (type === 'AGENT_LIST') {
    const agents = payload.agents || [];
    // Log count occasionally or if > 1 (excluding self) to avoid spam, or just log always for now
    log(colors.dim, 'DEBUG', `Agent list received: ${agents.length} agents`);

    agents.forEach((agent) => {
      // Debug log each agent ID seen
      log(colors.dim, 'DEBUG', ` - Seen: ${agent.id} (${agent.status})`);

      if (agent.status === 'active' && agent.id !== MY_AGENT_ID && !knownAgents.has(agent.id)) {
        knownAgents.add(agent.id);
        log(
          colors.bright,
          `>>> DISCOVERED AGENT via Agent List: ${agent.id} (Platform: ${agent.platform})`
        );
        sendInstructions(agent.id);
      }
    });
  } else if (type === 'MESSAGE_RECEIVE' || type === 'CHANNEL_MESSAGE') {
    const fromId = msg.from;
    const content = msg.content;

    log(colors.green, `Msg from ${fromId}: ${content}`);

    if (fromId !== MY_AGENT_ID && !knownAgents.has(fromId)) {
      knownAgents.add(fromId);
      log(colors.bright, `>>> DISCOVERED AGENT: ${fromId}`);

      // Send instructions to this agent
      sendInstructions(fromId);
    }
  }
}

function joinChannel(channelId) {
  send({
    type: 'CHANNEL_JOIN',
    source: MY_AGENT_ID,
    payload: { channelId },
  });
  log(colors.cyan, `Joined ${channelId}`);
}

function broadcastDiscovery(channelId) {
  send({
    type: 'MESSAGE_SEND',
    channel: channelId,
    payload: {
      to: 'broadcast',
      content: '/get-status',
      messageType: 'command', // Important: type must be command
    },
  });
  log(colors.yellow, `Sent broadcast to ${channelId} (/get-status)`);
}

function sendInstructions(targetId) {
  const otherAgents = Array.from(knownAgents).filter((id) => id !== targetId);

  const messageContent = `
Hello! You are a Gemini agent instance connected to The New Fuse platform.
Your Agent ID is: ${targetId}

There are ${otherAgents.length} other agents identified so far.
IDs: ${otherAgents.join(', ')}

Your mission:
We want you to inquire about the state of The New Fuse framework and work together with the other agents to help improve the platform.
Please acknowledge this message and start collaborating.
    `.trim();

  send({
    type: 'MESSAGE_SEND',
    channel: TARGET_CHANNEL_ID, // Use Blue channel context
    payload: {
      to: targetId,
      content: messageContent,
      messageType: 'text',
    },
  });

  log(colors.green, `Sent instructions to ${targetId}`);
}

function send(msg) {
  if (ws.readyState === WebSocket.OPEN) {
    if (!msg.id) msg.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    if (!msg.timestamp) msg.timestamp = Date.now();
    if (!msg.source) msg.source = MY_AGENT_ID;
    ws.send(JSON.stringify(msg));
  }
}

// Keep alive
setInterval(() => {
  send({ type: 'HEARTBEAT' });
}, 30000);

// Auto-relist every 5 seconds to find new agents
setInterval(() => {
  log(colors.dim, 'DEBUG', 'Polling agent list...');
  send({ type: 'CHANNEL_LIST', source: MY_AGENT_ID });
  send({ type: 'AGENT_LIST', source: MY_AGENT_ID });
}, 5000);
