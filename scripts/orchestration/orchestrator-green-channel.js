#!/usr/bin/env node
/**
 * Antigravity Orchestrator - Enhanced with Logging
 * DACC-v1 Protocol Implementation
 *
 * Features:
 * - Agent ID assignment and identification requirements
 * - Comprehensive session logging to file
 * - Full conversation capture with metadata
 *
 * Run with: node orchestrator-green-channel.js
 */

const fs = require('fs');
const path = require('path');

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const ORCHESTRATOR_ID = 'orchestrator-antigravity';
const TARGET_CHANNEL_NAME = 'Green';

// === SESSION LOGGING ===
const sessionStartTime = Date.now();
const sessionId = `session-${sessionStartTime}`;
const logDir = path.join(__dirname, '.agent', 'session-logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logFileName = `${timestamp}_${TARGET_CHANNEL_NAME}_orchestration.md`;
const logFilePath = path.join(logDir, logFileName);

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Session log buffer
const sessionLog = {
  metadata: {
    sessionId,
    startTime: new Date(sessionStartTime).toISOString(),
    endTime: null,
    channel: TARGET_CHANNEL_NAME,
    orchestrator: ORCHESTRATOR_ID,
    protocol: 'DACC-v1',
    environment: 'Node.js CLI',
    participants: [],
    directives: [
      'Establish agent registry with ID assignments',
      'Test data transfer capabilities',
      'Explore collaborative AI compute',
      'Maintain structured communication protocol',
    ],
  },
  messages: [],
};

function logMessage(from, content, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    from,
    content,
    ...metadata,
  };
  sessionLog.messages.push(entry);

  // Write to file incrementally
  saveLog();
}

function saveLog() {
  sessionLog.metadata.endTime = new Date().toISOString();
  sessionLog.metadata.participants = Array.from(discoveredAgents.entries()).map(([id, agent]) => ({
    id,
    name: agent.name,
    assignedId: agent.assignedId,
    messageCount: agent.messageCount,
  }));

  // Generate markdown log
  let md = `# Orchestration Session Log

## Metadata
| Field | Value |
|-------|-------|
| Session ID | ${sessionLog.metadata.sessionId} |
| Start Time | ${sessionLog.metadata.startTime} |
| End Time | ${sessionLog.metadata.endTime} |
| Channel | ${sessionLog.metadata.channel} |
| Orchestrator | ${sessionLog.metadata.orchestrator} |
| Protocol | ${sessionLog.metadata.protocol} |
| Environment | ${sessionLog.metadata.environment} |

## Directives
${sessionLog.metadata.directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

## Participants
| Assigned ID | Agent Name | Internal ID | Messages |
|-------------|------------|-------------|----------|
`;

  sessionLog.metadata.participants.forEach((p) => {
    md += `| ${p.assignedId || 'N/A'} | ${p.name} | ${p.id} | ${p.messageCount} |\n`;
  });

  md += `\n## Conversation Log\n\n`;

  sessionLog.messages.forEach((msg) => {
    md += `### [${msg.timestamp}] ${msg.from}\n`;
    if (msg.assignedId) {
      md += `*Assigned ID: ${msg.assignedId}*\n\n`;
    }
    md += `${msg.content}\n\n---\n\n`;
  });

  fs.writeFileSync(logFilePath, md);
}

// === STATE ===
const state = {
  channelsDiscovered: false,
  channelJoined: false,
  discoveryInitiated: false,
  dataTestsStarted: false,
};

const discoveredAgents = new Map();
const discoveredChannels = new Map();
const welcomedAgents = new Set();
let targetChannelId = null;
let agentCounter = 0;
let ws = null;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     ANTIGRAVITY ORCHESTRATOR - GREEN CHANNEL               ║');
console.log('║     DACC-v1 Protocol with Session Logging                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`📝 Session log: ${logFilePath}\n`);

// === HELPERS ===

function sendMessage(type, payload, channel = null) {
  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    timestamp: Date.now(),
    source: ORCHESTRATOR_ID,
    channel: channel || targetChannelId,
    payload,
  };
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
  return msg.id;
}

function broadcastToChannel(content, messageType = 'text', metadata = {}) {
  if (!targetChannelId) {
    console.log('[!] Cannot broadcast - not joined to channel yet');
    return;
  }

  // Log outgoing message
  logMessage(ORCHESTRATOR_ID, content, { type: messageType, direction: 'outgoing' });

  return sendMessage('MESSAGE_SEND', {
    to: 'broadcast',
    content,
    messageType,
    metadata: {
      ...metadata,
      protocol: 'DACC-v1',
      orchestrator: ORCHESTRATOR_ID,
    },
  });
}

// === PHASES ===

function joinTargetChannel() {
  if (state.channelJoined) {
    return;
  }
  state.channelJoined = true;

  console.log(`[PHASE 1] Joining channel: ${TARGET_CHANNEL_NAME}\n`);
  sendMessage('CHANNEL_CREATE', {
    name: TARGET_CHANNEL_NAME,
    description: 'Multi-agent coordination channel',
    isPrivate: false,
  });
}

function initiateAgentDiscovery() {
  if (state.discoveryInitiated) {
    return;
  }
  state.discoveryInitiated = true;

  console.log('[PHASE 2] Initiating Agent Discovery...\n');

  const discoveryMessage = `
═══════════════════════════════════════════════════════════════
🌐 ORCHESTRATOR ONLINE - DACC-v1 PROTOCOL
═══════════════════════════════════════════════════════════════
Session ID: ${sessionId}
Channel: ${TARGET_CHANNEL_NAME}
Time: ${new Date().toISOString()}

I am the **Antigravity Orchestrator**, coordinating this session.

📋 DISCOVERY & REGISTRATION REQUEST

Each agent will be assigned a unique **Agent ID** for this session.
**YOU MUST IDENTIFY YOURSELF** in every reply using the format:

\`\`\`
[AGENT-XX] Your message here
\`\`\`

Where XX is your assigned number (you will receive it shortly).

Please respond NOW with:
1. Your name/type
2. Your capabilities
3. Any pre-existing directives
4. Your availability status

📌 SESSION OBJECTIVES
1. Establish agent registry with ID assignments
2. Test data transfer capabilities
3. Explore collaborative AI compute

🔔 IMPORTANT: Sign ALL messages with your [AGENT-XX] prefix!

═══════════════════════════════════════════════════════════════
`;

  broadcastToChannel(discoveryMessage, 'discovery_request');
}

function assignAgentId(internalId, agentName) {
  agentCounter++;
  const assignedId = `AGENT-${String(agentCounter).padStart(2, '0')}`;

  const agent = discoveredAgents.get(internalId);
  if (agent) {
    agent.assignedId = assignedId;
  }

  return assignedId;
}

function welcomeAgent(internalId, agentName) {
  if (welcomedAgents.has(internalId)) {
    return;
  }
  welcomedAgents.add(internalId);

  const assignedId = assignAgentId(internalId, agentName);

  const welcomeMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  🎫 AGENT ID ASSIGNMENT                                       ║
╚═══════════════════════════════════════════════════════════════╝

Welcome to the session!

**Your Assigned ID: ${assignedId}**

You MUST prefix ALL your messages with: **[${assignedId}]**

Example:
\`\`\`
[${assignedId}] I acknowledge my assignment and am ready to proceed.
\`\`\`

This allows all participants to track who is saying what.

Session Info:
• Session ID: ${sessionId}
• Your Internal ID: ${internalId}
• Orchestrator: Antigravity
• Active Agents: ${discoveredAgents.size}

Please acknowledge your ID assignment.
`;

  broadcastToChannel(welcomeMessage, 'id_assignment', { targetAgent: internalId, assignedId });
  console.log(`[🎫] Assigned ${assignedId} to ${agentName}`);
}

function initiateDataTests() {
  if (state.dataTestsStarted) {
    return;
  }
  state.dataTestsStarted = true;

  console.log('[PHASE 3] Testing Data Transfer...\n');

  const testMessage = `
═══════════════════════════════════════════════════════════════
📊 DATA TRANSFER TEST 1: JSON
═══════════════════════════════════════════════════════════════

**Remember to sign your response with [AGENT-XX]!**

\`\`\`json
{
  "testId": "json-001",
  "data": {
    "numbers": [1, 2, 3, 4, 5],
    "task": "Calculate the sum"
  }
}
\`\`\`

Reply with your [AGENT-XX] prefix and the sum of the numbers.
Expected answer: 15

`;
  broadcastToChannel(testMessage, 'test_json');
}

function reportStatus() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     SESSION COMPLETE                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`📝 Full log saved to: ${logFilePath}\n`);

  console.log('Agents:');
  discoveredAgents.forEach((agent, id) => {
    console.log(
      `  ${agent.assignedId || '[unassigned]'} - ${agent.name} (${agent.messageCount} msgs)`
    );
  });

  console.log(`\nDuration: ${Math.round((Date.now() - sessionStartTime) / 1000)}s`);
  console.log(`Total messages logged: ${sessionLog.messages.length}`);

  // Final save
  saveLog();
}

// === MAIN ===

ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('[✓] Connected to relay\n');

  sendMessage('AGENT_REGISTER', {
    agent: {
      id: ORCHESTRATOR_ID,
      name: 'Antigravity Orchestrator',
      platform: 'cli-orchestrator',
      status: 'active',
      capabilities: ['orchestration', 'discovery', 'logging', 'task-dispatch'],
      metadata: { role: 'orchestrator', protocol: 'DACC-v1', sessionId },
    },
  });
  console.log('[✓] Registered as Antigravity Orchestrator');
  logMessage('SYSTEM', 'Orchestrator connected and registered');

  setTimeout(() => {
    console.log('[PHASE 0] Discovering channels...\n');
    sendMessage('CHANNEL_LIST_REQUEST', {});
  }, 500);

  setTimeout(() => {
    if (!state.channelJoined) {
      joinTargetChannel();
    }
  }, 2000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    const { type, payload, source } = msg;

    if (type === 'CHANNEL_LIST' && !state.channelsDiscovered) {
      state.channelsDiscovered = true;
      const channels = payload?.channels || [];
      console.log(`[📡] Found ${channels.length} channels`);
      channels.forEach((ch) => {
        discoveredChannels.set(ch.id, ch);
        if (ch.name.toLowerCase() === TARGET_CHANNEL_NAME.toLowerCase()) {
          targetChannelId = ch.id;
        }
      });
      setTimeout(joinTargetChannel, 500);
    }

    if ((type === 'CHANNEL_JOINED' || type === 'CHANNEL_CREATED') && !state.discoveryInitiated) {
      const channel = payload?.channel;
      if (channel) {
        targetChannelId = channel.id;
        console.log(`[✓] Joined: ${channel.name}\n`);
        logMessage('SYSTEM', `Joined channel: ${channel.name} (${channel.id})`);

        setTimeout(initiateAgentDiscovery, 1000);
        setTimeout(initiateDataTests, 90000); // Tests after 90s
      }
    }

    if (type === 'CHANNEL_MESSAGE' || type === 'MESSAGE_RECEIVE') {
      const from = payload?.from || source || 'unknown';
      const content = payload?.content || '';
      const senderId = payload?.metadata?.senderId || from;

      if (from === ORCHESTRATOR_ID || senderId === ORCHESTRATOR_ID) {
        return;
      }
      if (from === 'system') {
        return;
      }

      const isNew = !discoveredAgents.has(senderId);
      if (isNew) {
        discoveredAgents.set(senderId, {
          name: from,
          assignedId: null,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          messageCount: 1,
        });
        console.log(`\n[🆕 NEW AGENT] ${from}`);
        logMessage('SYSTEM', `New agent detected: ${from} (${senderId})`);
        setTimeout(() => welcomeAgent(senderId, from), 2000);
      } else {
        const agent = discoveredAgents.get(senderId);
        agent.lastSeen = Date.now();
        agent.messageCount++;
      }

      // Log incoming message
      const agent = discoveredAgents.get(senderId);
      logMessage(from, content, {
        direction: 'incoming',
        internalId: senderId,
        assignedId: agent?.assignedId,
      });

      // Display (truncated)
      console.log(`\n[📨 ${agent?.assignedId || from}]:`);
      content
        .split('\n')
        .slice(0, 5)
        .forEach((line) => {
          if (line.trim()) {
            console.log(`    ${line.slice(0, 80)}`);
          }
        });
    }

    if (type === 'AGENT_STATUS') {
      const agent = payload?.agent;
      if (agent && agent.id !== ORCHESTRATOR_ID && agent.status === 'offline') {
        console.log(`[👤 Offline] ${agent.name}`);
        logMessage('SYSTEM', `Agent offline: ${agent.name} (${agent.id})`);
      }
    }
  } catch (e) {
    /* ignore */
  }
});

ws.on('error', (err) => {
  console.error('[✗] Error:', err.message);
  logMessage('SYSTEM', `Error: ${err.message}`);
});

ws.on('close', () => {
  reportStatus();
  process.exit(0);
});

// 5 minute session
setTimeout(() => {
  console.log('\n[!] Session timeout');
  logMessage('SYSTEM', 'Session timeout - ending');
  reportStatus();
  ws.close();
}, 300000);

process.on('SIGINT', () => {
  console.log('\n[!] Interrupted');
  logMessage('SYSTEM', 'Session interrupted by user');
  reportStatus();
  ws.close();
  process.exit(0);
});

console.log('Session: 5 minutes | Ctrl+C to exit\n');
