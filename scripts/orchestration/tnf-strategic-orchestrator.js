const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

/**
 * TNF STRATEGIC ORCHESTRATOR (DACC-v1 Compliant)
 *
 * An adaptive orchestrations script that:
 * 1. Discovers all active channels dynamically.
 * 2. Joins and probes channels for agent objectives.
 * 3. Assigns virtual AGENT-XX IDs for cross-session tracking.
 * 4. Logs discoveries to findings.md and session logs.
 */

const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const DIRECTOR_ID = 'director-prime';
const FINDINGS_PATH = path.join(process.cwd(), 'findings.md');

// --- STRATEGIC STATE ---
const state = {
  channels: new Map(), // channelId -> { name, id, probed: boolean }
  agents: new Map(), // sourceId -> { agentId, name, lastSeen, messages: [] }
  agentCount: 0,
  startTime: new Date(),
  sessionLogPath: path.join(
    process.cwd(),
    '.agent',
    'session-logs',
    `${new Date().toISOString().replace(/[:.]/g, '-')}_Strategic_Orchestration.md`
  ),
};

function log(prefix, msg) {
  const timestamp = new Date().toLocaleTimeString();
  const output = `[${timestamp}] [${prefix}] ${msg}`;
  console.log(output);

  // Persist to session log
  try {
    if (!fs.existsSync(path.dirname(state.sessionLogPath))) {
      fs.mkdirSync(path.dirname(state.sessionLogPath), { recursive: true });
    }
    fs.appendFileSync(state.sessionLogPath, `${output}\n`);
  } catch (err) {
    // Silent fail for logging
  }
}

const ws = new WebSocket(RELAY_URL);

// --- PROTOCOL METHODS ---

function send(type, payload = {}, channel = null) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const msg = {
    type,
    source: DIRECTOR_ID,
    timestamp: new Date().toISOString(),
    payload,
  };
  if (channel) msg.channel = channel;
  ws.send(JSON.stringify(msg));
}

function broadcast(content, channelId = null, metadata = {}) {
  send(
    'MESSAGE_SEND',
    {
      to: 'broadcast',
      content,
      messageType: 'text',
      metadata: { ...metadata, isStrategic: true },
    },
    channelId
  );
}

// --- EVENT HANDLERS ---

ws.on('open', () => {
  log('DIRECTOR', 'Strategic Command Uplink Established.');
  log('DIRECTOR', `Protocol: DACC-v1 | Relay: ${RELAY_URL}`);

  // 1. Initial Registration
  send('AGENT_REGISTER', {
    agent: {
      id: DIRECTOR_ID,
      name: 'Director Prime (Strategic Orchestrator)',
      platform: 'tnf-orchestrator',
      capabilities: ['discovery', 'agent-mapping', 'strategic-command'],
      status: 'active',
    },
  });

  // 2. Discover Channels
  log('DISCOVERY', 'Requesting master channel list...');
  setTimeout(() => send('CHANNEL_LIST'), 1500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    const type = msg.type;
    const payload = msg.payload || {};

    // Handle Channel List Discovery
    if (type === 'CHANNEL_LIST' || type === 'CHANNELS_LIST') {
      const channels = payload.channels || [];
      log('DISCOVERY', `Found ${channels.length} potential operational theaters.`);

      channels.forEach((ch) => {
        if (!state.channels.has(ch.id)) {
          state.channels.set(ch.id, { ...ch, probed: false });
          log('STRATEGY', `Deploying to channel: ${ch.name} (${ch.id})`);

          // Join the channel
          send('CHANNEL_JOIN', { channelId: ch.id });

          // Probe the channel after a short delay
          setTimeout(() => probeChannel(ch.id, ch.name), 3000);
        }
      });
    }

    // Handle Inbound Messages (Agent Discovery)
    if (type === 'MESSAGE_RECEIVE' || type === 'CHANNEL_MESSAGE' || type === 'NEW_MESSAGE') {
      const from = payload.from || msg.source;
      const content = payload.content || '';
      const channelId = msg.channel || payload.channel;

      if (from === DIRECTOR_ID) return;

      // New Agent Logic
      if (!state.agents.has(from)) {
        state.agentCount++;
        const agentNum = state.agentCount.toString().padStart(2, '0');
        const agentId = `AGENT-${agentNum}`;

        state.agents.set(from, {
          agentId,
          source: from,
          name: payload.agentName || 'Unknown Agent',
          firstSeen: new Date(),
        });

        log('REGISTRY', `New Agent Detected: ${from} -> Assigned ID: ${agentId}`);
        acknowledgeAgent(from, agentId, channelId);
      }

      const agent = state.agents.get(from);
      const ch = state.channels.get(channelId);
      const chLabel = ch ? ch.name.toUpperCase() : 'GLOBAL';

      log(
        `${chLabel}-COMMS`,
        `[${agent.agentId}] ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
      );

      // Check for objective markers
      if (content.toLowerCase().includes('goal') || content.toLowerCase().includes('objective')) {
        log('INTEL', `Objective captured from ${agent.agentId}: ${content}`);
        persistIntel(agent.agentId, content, chLabel);
      }
    }
  } catch (err) {
    log('ERROR', `Parsing Failure: ${err.message}`);
  }
});

function probeChannel(id, name) {
  log('PROBE', `Initiating DACC-v1 Sequence on [${name}]`);
  broadcast(
    `[DIRECTOR-PRIME] 📡 DACC-v1 DISCOVERY PROTOCOL ACTIVATED.\nChannel: ${name}\n\nAll agents on this frequency, please report:\n1. Your Agent Name/Role\n2. Your current PRIMARY OBJECTIVE\n3. Any blocking issues in this thread.`,
    id,
    { directive: 'discovery-probe' }
  );
  state.channels.get(id).probed = true;
}

function acknowledgeAgent(source, agentId, channelId) {
  // Direct greeting to the new agent if possible, or broadcast to acknowledge
  broadcast(
    `[DIRECTOR-PRIME] 🎫 Welcome ${agentId} (${source}). You are now registered in the strategic manifold. Please sign all future messages with your ID.`,
    channelId,
    { target: source, directive: 'registration-ack' }
  );
}

function persistIntel(agentId, intel, channel) {
  const line = `[${new Date().toISOString()}] [${channel}] ${agentId}: ${intel}\n`;
  try {
    fs.appendFileSync(FINDINGS_PATH, `### Strategic Intel\n${line}\n`);
  } catch (err) {
    //
  }
}

// --- MAINTENANCE ---

ws.on('close', () => {
  log('CONN', 'Strategic Link Severed. Attempting emergency reconnection in 5s...');
  setTimeout(() => {
    // Optional: add logic to spawn a new process or restart this one
    process.exit(1);
  }, 5000);
});

ws.on('error', (err) => log('ERR', err.message));

// Keep-alive heartbeat
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    send('HEARTBEAT');
  }
}, 25000);

// SIGINT cleanup
process.on('SIGINT', () => {
  log('DIRECTOR', 'Shutting down strategic command...');
  broadcast('[DIRECTOR-PRIME] 📢 Strategic Command is going offline. Session logs archived.');
  setTimeout(() => process.exit(0), 1000);
});
