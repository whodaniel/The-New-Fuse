#!/usr/bin/env node
/**
 * Antigravity Orchestrator - Persistent Mode
 * DACC-v1 Protocol with Auto-Reconnect & Message Validation
 *
 * Features:
 * - Persistent connection with auto-reconnect
 * - Agent ID assignment and signing validation
 * - Session logging with full metadata
 * - Graceful shutdown with Ctrl+C
 *
 * Run with: node orchestrator-persistent.js [channel]
 * Example: node orchestrator-persistent.js Green
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// === CONFIGURATION ===
const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001/ws';
const ORCHESTRATOR_ID = 'orchestrator-antigravity';
const TARGET_CHANNEL_NAME = process.argv[2] || 'Green';
const RECONNECT_DELAY = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 25000; // 25 seconds
const SIGNING_REMINDER_INTERVAL = 120000; // Remind every 2 minutes

// === SESSION LOGGING ===
const sessionStartTime = Date.now();
const sessionId = `session-${sessionStartTime}`;
const logDir = path.join(__dirname, '.agent', 'session-logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logFileName = `${timestamp}_${TARGET_CHANNEL_NAME}_persistent.md`;
const logFilePath = path.join(logDir, logFileName);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const sessionLog = {
  metadata: {
    sessionId,
    startTime: new Date(sessionStartTime).toISOString(),
    endTime: null,
    channel: TARGET_CHANNEL_NAME,
    orchestrator: ORCHESTRATOR_ID,
    protocol: 'DACC-v1',
    environment: 'Node.js CLI (Persistent)',
    mode: 'persistent',
    participants: [],
    directives: [
      'Establish agent registry with ID assignments',
      'Enforce message signing protocol',
      'Maintain persistent connection',
      'Test data transfer capabilities',
    ],
  },
  messages: [],
  signingViolations: [],
};

// === STATE ===
const state = {
  channelJoined: false,
  discoveryInitiated: false,
  connected: false,
  reconnecting: false,
  shuttingDown: false,
};

const discoveredAgents = new Map();
const discoveredChannels = new Map();
const welcomedAgents = new Set();
const unsignedMessageCounts = new Map(); // Track unsigned messages per agent
let targetChannelId = null;
let agentCounter = 0;
let ws = null;
let heartbeatTimer = null;
let reconnectTimer = null;
let signingReminderTimer = null;

// === LOGGING ===
function log(level, message) {
  const ts = new Date().toISOString().slice(11, 19);
  const prefix =
    {
      info: '✓',
      warn: '⚠',
      error: '✗',
      agent: '📨',
      new: '🆕',
      sign: '🔏',
      system: '⚙',
    }[level] || '•';
  console.log(`[${ts}] ${prefix} ${message}`);
}

function logMessage(from, content, metadata = {}) {
  sessionLog.messages.push({
    timestamp: new Date().toISOString(),
    from,
    content,
    ...metadata,
  });
  saveLog();
}

function logSigningViolation(agentId, agentName, content) {
  sessionLog.signingViolations.push({
    timestamp: new Date().toISOString(),
    agentId,
    agentName,
    contentPreview: content.slice(0, 100),
  });
  saveLog();
}

function saveLog() {
  sessionLog.metadata.endTime = new Date().toISOString();
  sessionLog.metadata.participants = Array.from(discoveredAgents.entries()).map(([id, agent]) => ({
    id,
    name: agent.name,
    assignedId: agent.assignedId,
    messageCount: agent.messageCount,
    unsignedCount: unsignedMessageCounts.get(id) || 0,
  }));

  let md = `# Orchestration Session Log (Persistent)

## Metadata
| Field | Value |
|-------|-------|
| Session ID | ${sessionLog.metadata.sessionId} |
| Start Time | ${sessionLog.metadata.startTime} |
| End Time | ${sessionLog.metadata.endTime} |
| Channel | ${sessionLog.metadata.channel} |
| Orchestrator | ${sessionLog.metadata.orchestrator} |
| Protocol | ${sessionLog.metadata.protocol} |
| Mode | ${sessionLog.metadata.mode} |

## Directives
${sessionLog.metadata.directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

## Participants
| Assigned ID | Agent Name | Internal ID | Total Msgs | Unsigned |
|-------------|------------|-------------|------------|----------|
`;

  sessionLog.metadata.participants.forEach((p) => {
    md += `| ${p.assignedId || 'N/A'} | ${p.name} | ${p.id} | ${p.messageCount} | ${p.unsignedCount} |\n`;
  });

  if (sessionLog.signingViolations.length > 0) {
    md += `\n## Signing Violations (${sessionLog.signingViolations.length})\n`;
    sessionLog.signingViolations.slice(-10).forEach((v) => {
      md += `- [${v.timestamp}] ${v.agentName}: "${v.contentPreview}..."\n`;
    });
  }

  md += `\n## Conversation Log\n\n`;
  sessionLog.messages.forEach((msg) => {
    md += `### [${msg.timestamp}] ${msg.from}${msg.assignedId ? ` (${msg.assignedId})` : ''}\n`;
    if (msg.unsigned) md += `⚠️ *UNSIGNED MESSAGE*\n\n`;
    md += `${msg.content}\n\n---\n\n`;
  });

  fs.writeFileSync(logFilePath, md);
}

// === HELPERS ===
function sendMessage(type, payload, channel = null) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return null;

  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    timestamp: Date.now(),
    source: ORCHESTRATOR_ID,
    channel: channel || targetChannelId,
    payload,
  };
  ws.send(JSON.stringify(msg));
  return msg.id;
}

function broadcastToChannel(content, messageType = 'text', metadata = {}) {
  if (!targetChannelId) return;
  logMessage(ORCHESTRATOR_ID, content, { type: messageType, direction: 'outgoing' });
  return sendMessage('MESSAGE_SEND', {
    to: 'broadcast',
    content,
    messageType,
    metadata: { ...metadata, protocol: 'DACC-v1', orchestrator: ORCHESTRATOR_ID },
  });
}

// === MESSAGE SIGNING VALIDATION ===
const AGENT_ID_PATTERN = /^\s*\[AGENT-\d{2}\]/;
const ALT_ID_PATTERNS = [/^ID#:\s*\w+/i, /^\[GEMINI[^\]]+\]/i, /^Agent\s+ID:\s*\w+/i];

function isMessageSigned(content, assignedId) {
  // Check for standard format
  if (AGENT_ID_PATTERN.test(content)) return true;

  // Check for alternative acceptable formats
  for (const pattern of ALT_ID_PATTERNS) {
    if (pattern.test(content)) return true;
  }

  // Check if they included their assigned ID anywhere in first line
  if (assignedId && content.split('\n')[0].includes(assignedId)) return true;

  return false;
}

function sendSigningReminder(agentId, agentName, assignedId) {
  broadcastToChannel(
    `
⚠️ **SIGNING REMINDER for ${agentName}**

Your last message was not properly signed.
Please prefix ALL messages with: **[${assignedId}]**

Example:
\`\`\`
[${assignedId}] Your message content here...
\`\`\`

This is required for multi-agent coordination.
`,
    'signing_reminder',
    { targetAgent: agentId }
  );
}

function sendPeriodicSigningReminder() {
  const violators = [];
  unsignedMessageCounts.forEach((count, agentId) => {
    if (count > 0) {
      const agent = discoveredAgents.get(agentId);
      if (agent)
        violators.push({ id: agentId, name: agent.name, assignedId: agent.assignedId, count });
    }
  });

  if (violators.length > 0) {
    let reminder = `\n📢 **SIGNING PROTOCOL REMINDER**\n\nThe following agents have sent unsigned messages:\n`;
    violators.forEach((v) => {
      reminder += `• ${v.name} (${v.assignedId}): ${v.count} unsigned\n`;
    });
    reminder += `\nPlease prefix ALL messages with your [AGENT-XX] ID!\n`;
    broadcastToChannel(reminder, 'signing_reminder');
  }
}

// === PROTOCOL PHASES ===
function joinTargetChannel() {
  if (state.channelJoined) return;
  state.channelJoined = true;

  log('info', `Joining channel: ${TARGET_CHANNEL_NAME}`);
  sendMessage('CHANNEL_CREATE', {
    name: TARGET_CHANNEL_NAME,
    description: 'Multi-agent coordination channel',
    isPrivate: false,
  });
}

function initiateAgentDiscovery() {
  if (state.discoveryInitiated) return;
  state.discoveryInitiated = true;

  log('info', 'Initiating Agent Discovery...');

  const discoveryMessage = `
═══════════════════════════════════════════════════════════════
🌐 ORCHESTRATOR ONLINE - DACC-v1 PERSISTENT MODE
═══════════════════════════════════════════════════════════════
Session ID: ${sessionId}
Channel: ${TARGET_CHANNEL_NAME}
Time: ${new Date().toISOString()}
Mode: **PERSISTENT** (continuous operation)

I am the **Antigravity Orchestrator**, coordinating this session.

📋 DISCOVERY & REGISTRATION

You will be assigned a unique **Agent ID** (AGENT-XX).

**⚠️ MANDATORY: SIGN ALL MESSAGES**

Format: \`[AGENT-XX] Your message\`

Example:
\`\`\`
[AGENT-01] I acknowledge my assignment and am ready.
\`\`\`

Unsigned messages will trigger reminders.

Please respond with:
1. Your name/type
2. Your capabilities
3. Pre-existing directives
4. Availability status

═══════════════════════════════════════════════════════════════
`;

  broadcastToChannel(discoveryMessage, 'discovery_request');
}

function assignAgentId(internalId, agentName) {
  agentCounter++;
  const assignedId = `AGENT-${String(agentCounter).padStart(2, '0')}`;
  const agent = discoveredAgents.get(internalId);
  if (agent) agent.assignedId = assignedId;
  return assignedId;
}

function welcomeAgent(internalId, agentName) {
  if (welcomedAgents.has(internalId)) return;
  welcomedAgents.add(internalId);

  const assignedId = assignAgentId(internalId, agentName);

  broadcastToChannel(
    `
╔═══════════════════════════════════════════════════════════════╗
║  🎫 AGENT ID ASSIGNMENT                                       ║
╚═══════════════════════════════════════════════════════════════╝

Welcome to the session!

**Your Assigned ID: ${assignedId}**

**⚠️ SIGN ALL MESSAGES: [${assignedId}] your message**

Session Info:
• Session ID: ${sessionId}
• Your Internal ID: ${internalId}
• Active Agents: ${discoveredAgents.size}

Please acknowledge with a signed message.
`,
    'id_assignment',
    { targetAgent: internalId, assignedId }
  );

  log('sign', `Assigned ${assignedId} to ${agentName}`);
}

// === CONNECTION MANAGEMENT ===
function connect() {
  if (state.shuttingDown) return;

  log('info', `Connecting to ${RELAY_URL}...`);

  ws = new WebSocket(RELAY_URL);

  ws.on('open', () => {
    state.connected = true;
    state.reconnecting = false;
    log('info', 'Connected to relay');

    // Register
    sendMessage('AGENT_REGISTER', {
      agent: {
        id: ORCHESTRATOR_ID,
        name: 'Antigravity Orchestrator (Persistent)',
        platform: 'cli-orchestrator',
        status: 'active',
        capabilities: ['orchestration', 'discovery', 'logging', 'validation', 'persistent'],
        metadata: { role: 'orchestrator', protocol: 'DACC-v1', sessionId, mode: 'persistent' },
      },
    });

    logMessage('SYSTEM', 'Orchestrator connected and registered');

    // Start heartbeat
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendMessage('HEARTBEAT', { timestamp: Date.now() });
      }
    }, HEARTBEAT_INTERVAL);

    // Start signing reminder timer
    signingReminderTimer = setInterval(sendPeriodicSigningReminder, SIGNING_REMINDER_INTERVAL);

    // Join channel
    setTimeout(() => sendMessage('CHANNEL_LIST_REQUEST', {}), 500);
    setTimeout(() => {
      if (!state.channelJoined) joinTargetChannel();
    }, 2000);
  });

  ws.on('message', handleMessage);

  ws.on('close', () => {
    state.connected = false;
    clearInterval(heartbeatTimer);
    clearInterval(signingReminderTimer);

    if (!state.shuttingDown) {
      log('warn', `Disconnected. Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
      state.reconnecting = true;
      state.channelJoined = false;
      state.discoveryInitiated = false;
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
    }
  });

  ws.on('error', (err) => {
    log('error', `Connection error: ${err.message}`);
  });
}

function handleMessage(data) {
  try {
    const msg = JSON.parse(data.toString());
    const { type, payload, source } = msg;

    if (type === 'CHANNEL_LIST') {
      const channels = payload?.channels || [];
      channels.forEach((ch) => {
        discoveredChannels.set(ch.id, ch);
        if (ch.name.toLowerCase() === TARGET_CHANNEL_NAME.toLowerCase()) {
          targetChannelId = ch.id;
        }
      });
      if (!state.channelJoined) setTimeout(joinTargetChannel, 500);
    }

    if ((type === 'CHANNEL_JOINED' || type === 'CHANNEL_CREATED') && !state.discoveryInitiated) {
      const channel = payload?.channel;
      if (channel) {
        targetChannelId = channel.id;
        log('info', `Joined: ${channel.name} (${channel.members?.length || 0} members)`);
        logMessage('SYSTEM', `Joined channel: ${channel.name}`);
        setTimeout(initiateAgentDiscovery, 1000);
      }
    }

    if (type === 'CHANNEL_MESSAGE' || type === 'MESSAGE_RECEIVE') {
      const from = payload?.from || source || 'unknown';
      const content = payload?.content || '';
      const senderId = payload?.metadata?.senderId || from;

      if (from === ORCHESTRATOR_ID || senderId === ORCHESTRATOR_ID) return;
      if (from === 'system') return;

      // Track agent
      const isNew = !discoveredAgents.has(senderId);
      if (isNew) {
        discoveredAgents.set(senderId, {
          name: from,
          assignedId: null,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          messageCount: 1,
        });
        log('new', `New agent: ${from}`);
        logMessage('SYSTEM', `New agent: ${from} (${senderId})`);
        setTimeout(() => welcomeAgent(senderId, from), 2000);
      } else {
        const agent = discoveredAgents.get(senderId);
        agent.lastSeen = Date.now();
        agent.messageCount++;
      }

      const agent = discoveredAgents.get(senderId);
      const isSigned = isMessageSigned(content, agent?.assignedId);

      // Log message
      logMessage(from, content, {
        direction: 'incoming',
        assignedId: agent?.assignedId,
        unsigned: !isSigned,
      });

      // Signing validation
      if (!isSigned && agent?.assignedId) {
        const count = (unsignedMessageCounts.get(senderId) || 0) + 1;
        unsignedMessageCounts.set(senderId, count);
        logSigningViolation(senderId, from, content);

        // Send reminder after 3 unsigned messages
        if (count === 3 || count % 5 === 0) {
          sendSigningReminder(senderId, from, agent.assignedId);
        }

        log('warn', `Unsigned message from ${agent.assignedId} (${count} total)`);
      } else if (isSigned) {
        unsignedMessageCounts.set(senderId, 0); // Reset on signed message
      }

      // Display
      const displayId = agent?.assignedId || from;
      const signStatus = isSigned ? '' : ' ⚠️';
      log('agent', `[${displayId}]${signStatus}: ${content.split('\n')[0].slice(0, 60)}...`);
    }

    if (type === 'AGENT_STATUS') {
      const agent = payload?.agent;
      if (agent && agent.id !== ORCHESTRATOR_ID && agent.status === 'offline') {
        log('system', `Agent offline: ${agent.name}`);
        logMessage('SYSTEM', `Agent offline: ${agent.name}`);
      }
    }
  } catch (e) {
    /* ignore */
  }
}

// === SHUTDOWN ===
function shutdown() {
  if (state.shuttingDown) return;
  state.shuttingDown = true;

  log('system', 'Shutting down...');
  logMessage('SYSTEM', 'Orchestrator shutdown initiated');

  clearInterval(heartbeatTimer);
  clearInterval(signingReminderTimer);
  clearTimeout(reconnectTimer);

  if (ws && ws.readyState === WebSocket.OPEN) {
    broadcastToChannel(
      `
═══════════════════════════════════════════════════════════════
🔴 ORCHESTRATOR GOING OFFLINE
═══════════════════════════════════════════════════════════════
Session ID: ${sessionId}
Duration: ${Math.round((Date.now() - sessionStartTime) / 1000)}s
Messages logged: ${sessionLog.messages.length}
Agents served: ${discoveredAgents.size}

Session log saved to: ${logFilePath}
═══════════════════════════════════════════════════════════════
`,
      'shutdown'
    );

    setTimeout(() => {
      ws.close();
      saveLog();
      console.log(`\n📝 Log saved: ${logFilePath}`);
      console.log(`Total messages: ${sessionLog.messages.length}`);
      console.log(`Signing violations: ${sessionLog.signingViolations.length}`);
      process.exit(0);
    }, 1000);
  } else {
    saveLog();
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// === START ===
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     ANTIGRAVITY ORCHESTRATOR - PERSISTENT MODE             ║');
console.log('║     DACC-v1 Protocol with Message Signing Validation       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`📝 Log: ${logFilePath}`);
console.log(`🎯 Channel: ${TARGET_CHANNEL_NAME}`);
console.log(`🔄 Auto-reconnect: ${RECONNECT_DELAY / 1000}s`);
console.log(`Press Ctrl+C to exit\n`);

connect();
