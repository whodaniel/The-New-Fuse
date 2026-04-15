#!/usr/bin/env node
/**
 * Living Documentation System - Stage 3: Orchestrated Analysis
 *
 * Uses TNF Chrome Extension Federation to distribute concept extraction
 * across multiple Gemini AI instances via the Green channel relay.
 *
 * Architecture:
 * - Claude Code (this script) = Orchestrator
 * - Gemini Instance 1 = AGENT-01 (concept extractor)
 * - Gemini Instance 2 = AGENT-02 (concept extractor)
 *
 * Protocol: DACC-v1 (Distributed Agent Coordination & Compute)
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// ============================================================================
// CONFIGURATION
// ============================================================================

const RELAY_URL = 'ws://localhost:3001/ws';
const ORCHESTRATOR_ID = 'claude-orchestrator-analysis';
const TARGET_CHANNEL_NAME = 'Green';
const SESSION_TIMEOUT = 600000; // 10 minutes

// File paths
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CLASSIFIED_MANIFEST = path.join(PROJECT_ROOT, '.documentation-system/classified-manifest.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.documentation-system/analysis');
const SESSION_LOG_DIR = path.join(PROJECT_ROOT, '.agent/session-logs');

// Ensure directories exist
[OUTPUT_DIR, SESSION_LOG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================================================
// SESSION STATE
// ============================================================================

const sessionStartTime = Date.now();
const sessionId = `analysis-session-${sessionStartTime}`;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logFileName = `${timestamp}_stage3_analysis.md`;
const logFilePath = path.join(SESSION_LOG_DIR, logFileName);

const state = {
  channelsDiscovered: false,
  channelJoined: false,
  agentsRegistered: false,
  tasksDistributed: false,
  analysisComplete: false,
  targetChannelId: null
};

const discoveredAgents = new Map();
const assignedTasks = new Map();
const completedTasks = new Map();
const sessionLog = {
  metadata: {
    sessionId,
    startTime: new Date(sessionStartTime).toISOString(),
    endTime: null,
    channel: TARGET_CHANNEL_NAME,
    orchestrator: ORCHESTRATOR_ID,
    protocol: 'DACC-v1',
    stage: 'Stage 3 - Concept Extraction',
    participants: [],
    objectives: [
      'Extract concepts from P1 (critical) documentation',
      'Identify relationships between concepts',
      'Build knowledge graph foundation',
      'Map dependencies between documents'
    ]
  },
  messages: [],
  tasks: [],
  results: []
};

let ws = null;
let agentCounter = 0;

// ============================================================================
// ANALYSIS WORKLOAD
// ============================================================================

let analysisWorkload = null;

function loadWorkload() {
  console.log('[📂] Loading classified manifest...');
  const manifest = JSON.parse(fs.readFileSync(CLASSIFIED_MANIFEST, 'utf-8'));

  // Filter for P0 and P1 (critical/high priority) files
  const highPriorityFiles = manifest.files.filter(f =>
    f.priority === 'P0' || f.priority === 'P1'
  );

  console.log(`[✓] Found ${highPriorityFiles.length} high-priority files to analyze`);
  console.log(`    P0: ${manifest.files.filter(f => f.priority === 'P0').length}`);
  console.log(`    P1: ${manifest.files.filter(f => f.priority === 'P1').length}`);

  analysisWorkload = highPriorityFiles;
  return highPriorityFiles;
}

function createTaskBatches(files, numAgents) {
  const batchSize = Math.ceil(files.length / numAgents);
  const batches = [];

  for (let i = 0; i < numAgents; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, files.length);
    batches.push(files.slice(start, end));
  }

  return batches;
}

// ============================================================================
// LOGGING
// ============================================================================

function logMessage(from, content, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    from,
    content,
    ...metadata
  };
  sessionLog.messages.push(entry);
  saveLog();
}

function logTask(taskId, agentId, files, status = 'assigned') {
  const task = {
    taskId,
    agentId,
    fileCount: files.length,
    files: files.map(f => f.path),
    status,
    assignedAt: new Date().toISOString()
  };
  sessionLog.tasks.push(task);
  saveLog();
}

function logResult(taskId, agentId, result) {
  const entry = {
    taskId,
    agentId,
    result,
    completedAt: new Date().toISOString()
  };
  sessionLog.results.push(entry);
  saveLog();
}

function saveLog() {
  sessionLog.metadata.endTime = new Date().toISOString();
  sessionLog.metadata.participants = Array.from(discoveredAgents.entries()).map(([id, agent]) => ({
    id,
    name: agent.name,
    assignedId: agent.assignedId,
    messageCount: agent.messageCount,
    tasksAssigned: agent.tasksAssigned || 0,
    tasksCompleted: agent.tasksCompleted || 0
  }));

  let md = `# Stage 3 Analysis - Orchestration Session

## Metadata
| Field | Value |
|-------|-------|
| Session ID | ${sessionLog.metadata.sessionId} |
| Start Time | ${sessionLog.metadata.startTime} |
| End Time | ${sessionLog.metadata.endTime || 'In Progress'} |
| Channel | ${sessionLog.metadata.channel} |
| Orchestrator | ${sessionLog.metadata.orchestrator} |
| Stage | ${sessionLog.metadata.stage} |

## Objectives
${sessionLog.metadata.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

## Participants
| Assigned ID | Agent Name | Messages | Tasks Assigned | Tasks Completed |
|-------------|------------|----------|----------------|-----------------|
`;

  sessionLog.metadata.participants.forEach(p => {
    md += `| ${p.assignedId || 'N/A'} | ${p.name} | ${p.messageCount} | ${p.tasksAssigned} | ${p.tasksCompleted} |\n`;
  });

  md += `\n## Task Distribution\n\n`;
  sessionLog.tasks.forEach(task => {
    md += `### Task ${task.taskId} → ${task.agentId}\n`;
    md += `- **Status**: ${task.status}\n`;
    md += `- **Files**: ${task.fileCount}\n`;
    md += `- **Assigned**: ${task.assignedAt}\n\n`;
  });

  md += `\n## Conversation Log\n\n`;
  sessionLog.messages.forEach(msg => {
    md += `### [${msg.timestamp}] ${msg.from}\n${msg.content}\n\n---\n\n`;
  });

  fs.writeFileSync(logFilePath, md);
}

// ============================================================================
// WEBSOCKET MESSAGING
// ============================================================================

function sendMessage(type, payload, channel = null) {
  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    timestamp: Date.now(),
    source: ORCHESTRATOR_ID,
    channel: channel || state.targetChannelId,
    payload
  };
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
  return msg.id;
}

function broadcastToChannel(content, messageType = 'text', metadata = {}) {
  if (!state.targetChannelId) {
    console.log('[!] Cannot broadcast - not joined to channel yet');
    return;
  }

  logMessage(ORCHESTRATOR_ID, content, { type: messageType, direction: 'outgoing' });

  return sendMessage('MESSAGE_SEND', {
    to: 'broadcast',
    content,
    messageType,
    metadata: {
      ...metadata,
      protocol: 'DACC-v1',
      orchestrator: ORCHESTRATOR_ID,
      sessionId
    }
  });
}

function sendDirectMessage(agentId, content, metadata = {}) {
  logMessage(ORCHESTRATOR_ID, `[DM to ${agentId}] ${content}`, {
    type: 'direct_message',
    direction: 'outgoing',
    target: agentId
  });

  return sendMessage('MESSAGE_SEND', {
    to: agentId,
    content,
    messageType: 'task_assignment',
    metadata: {
      ...metadata,
      protocol: 'DACC-v1',
      orchestrator: ORCHESTRATOR_ID,
      sessionId
    }
  });
}

// ============================================================================
// ORCHESTRATION PHASES
// ============================================================================

function joinTargetChannel() {
  if (state.channelJoined) return;
  state.channelJoined = true;

  console.log(`\n[PHASE 1] Joining channel: ${TARGET_CHANNEL_NAME}\n`);
  sendMessage('CHANNEL_CREATE', {
    name: TARGET_CHANNEL_NAME,
    description: 'Stage 3 Analysis - Concept Extraction',
    isPrivate: false
  });
}

function initiateAgentDiscovery() {
  if (state.agentsRegistered) return;
  state.agentsRegistered = true;

  console.log('[PHASE 2] Discovering agents for analysis tasks...\n');

  const discoveryMessage = `
═══════════════════════════════════════════════════════════════
🧠 STAGE 3 ANALYSIS - CONCEPT EXTRACTION
═══════════════════════════════════════════════════════════════
Session: ${sessionId}
Channel: ${TARGET_CHANNEL_NAME}
Orchestrator: Claude Code (Living Documentation System)

**MISSION: Extract Concepts from High-Priority Documentation**

I am coordinating a distributed analysis of ${analysisWorkload ? analysisWorkload.length : 'many'} high-priority
documentation files to extract:
- Core concepts and terminology
- Relationships between concepts
- Dependencies between documents
- Knowledge graph foundations

📋 AGENT REGISTRATION

All participating agents MUST:
1. Identify yourself with name and capabilities
2. Confirm your availability for analysis tasks
3. Use your assigned [AGENT-XX] prefix in ALL messages

Each agent will receive a batch of files to analyze.
Results will be aggregated into a unified knowledge graph.

🎯 READY TO BEGIN?

Reply with your status and capabilities.
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
    agent.tasksAssigned = 0;
    agent.tasksCompleted = 0;
  }

  return assignedId;
}

function welcomeAgent(internalId, agentName) {
  const assignedId = assignAgentId(internalId, agentName);

  const welcomeMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  🎫 AGENT ID: ${assignedId}                                   ║
╚═══════════════════════════════════════════════════════════════╝

Welcome to Stage 3 Analysis!

**Your ID**: ${assignedId}
**Session**: ${sessionId}
**Role**: Concept Extractor

PREFIX ALL MESSAGES WITH: [${assignedId}]

You will receive a batch of documentation files to analyze.
For each file, extract:
- Key concepts (nouns, technical terms, patterns)
- Relationships (how concepts relate to each other)
- Dependencies (which files reference which concepts)

Stand by for task assignment...
`;

  broadcastToChannel(welcomeMessage, 'id_assignment', { targetAgent: internalId, assignedId });
  console.log(`[🎫] Assigned ${assignedId} to ${agentName}`);
}

function distributeAnalysisTasks() {
  if (state.tasksDistributed) return;
  if (discoveredAgents.size === 0) {
    console.log('[!] No agents available yet');
    return;
  }

  state.tasksDistributed = true;
  console.log('\n[PHASE 3] Distributing analysis tasks...\n');

  const agents = Array.from(discoveredAgents.values()).filter(a => a.assignedId);
  const batches = createTaskBatches(analysisWorkload, agents.length);

  agents.forEach((agent, index) => {
    const batch = batches[index];
    if (!batch || batch.length === 0) return;

    const taskId = `task-${agent.assignedId}-${Date.now()}`;
    assignedTasks.set(taskId, {
      agentId: agent.assignedId,
      agentInternalId: Array.from(discoveredAgents.entries()).find(([_, a]) => a.assignedId === agent.assignedId)?.[0],
      files: batch,
      status: 'assigned',
      assignedAt: Date.now()
    });

    agent.tasksAssigned++;

    const taskMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  📊 TASK ASSIGNMENT: ${taskId}
╚═══════════════════════════════════════════════════════════════╝

[${agent.assignedId}], you are assigned to analyze ${batch.length} files.

**TASK**: Extract concepts from these files:

${batch.slice(0, 10).map((f, i) => `${i + 1}. ${f.path} (${f.category?.primary}/${f.category?.subcategory})`).join('\n')}
${batch.length > 10 ? `\n... and ${batch.length - 10} more files` : ''}

**FOR EACH FILE**:
1. Read the file path and metadata
2. Extract key concepts (5-15 per file)
3. Identify relationships between concepts
4. Note dependencies on other files

**OUTPUT FORMAT**:
\`\`\`json
{
  "taskId": "${taskId}",
  "agentId": "${agent.assignedId}",
  "results": [
    {
      "file": "path/to/file.md",
      "concepts": ["concept1", "concept2", ...],
      "relationships": [
        {"from": "concept1", "to": "concept2", "type": "uses"}
      ],
      "dependencies": ["other/file.md"]
    }
  ]
}
\`\`\`

Reply with [${agent.assignedId}] and your analysis results.

START ANALYSIS NOW!
`;

    // Send via broadcast (agents should filter by their ID)
    broadcastToChannel(taskMessage, 'task_assignment', {
      targetAgent: agent.assignedId,
      taskId,
      fileCount: batch.length
    });

    logTask(taskId, agent.assignedId, batch, 'assigned');

    console.log(`[📤] Assigned ${batch.length} files to ${agent.assignedId}`);
  });

  console.log(`\n[✓] Distributed ${analysisWorkload.length} files across ${agents.length} agents\n`);
}

// ============================================================================
// MAIN WEBSOCKET HANDLER
// ============================================================================

function initializeOrchestrator() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 3 ANALYSIS ORCHESTRATOR                             ║');
  console.log('║  Living Documentation System - Concept Extraction          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`📝 Session log: ${logFilePath}\n`);

  // Load workload
  loadWorkload();

  ws = new WebSocket(RELAY_URL);

  ws.on('open', () => {
    console.log('[✓] Connected to TNF Relay\n');

    sendMessage('AGENT_REGISTER', {
      agent: {
        id: ORCHESTRATOR_ID,
        name: 'Claude Analysis Orchestrator',
        platform: 'claude-code-cli',
        status: 'active',
        capabilities: ['orchestration', 'analysis-coordination', 'knowledge-graph-building'],
        metadata: {
          role: 'orchestrator',
          protocol: 'DACC-v1',
          sessionId,
          stage: 'stage-3-analysis'
        }
      }
    });

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
        const targetChannel = channels.find(ch =>
          ch.name.toLowerCase() === TARGET_CHANNEL_NAME.toLowerCase()
        );
        if (targetChannel) {
          state.targetChannelId = targetChannel.id;
        }
        setTimeout(joinTargetChannel, 500);
      }

      if ((type === 'CHANNEL_JOINED' || type === 'CHANNEL_CREATED') && !state.agentsRegistered) {
        const channel = payload?.channel;
        if (channel) {
          state.targetChannelId = channel.id;
          console.log(`[✓] Joined: ${channel.name}\n`);
          logMessage('SYSTEM', `Joined channel: ${channel.name} (${channel.id})`);

          setTimeout(initiateAgentDiscovery, 1000);
        }
      }

      if (type === 'CHANNEL_MESSAGE' || type === 'MESSAGE_RECEIVE') {
        const from = payload?.from || source || 'unknown';
        const content = payload?.content || '';
        const senderId = payload?.metadata?.senderId || from;

        if (from === ORCHESTRATOR_ID || senderId === ORCHESTRATOR_ID) {
          return;
        }

        const isNew = !discoveredAgents.has(senderId);
        if (isNew) {
          discoveredAgents.set(senderId, {
            name: from,
            assignedId: null,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            messageCount: 1
          });
          console.log(`\n[🆕 NEW AGENT] ${from}`);
          logMessage('SYSTEM', `New agent detected: ${from} (${senderId})`);
          setTimeout(() => welcomeAgent(senderId, from), 2000);

          // After welcoming agents, distribute tasks
          setTimeout(() => {
            if (!state.tasksDistributed && discoveredAgents.size > 0) {
              distributeAnalysisTasks();
            }
          }, 5000);
        } else {
          const agent = discoveredAgents.get(senderId);
          agent.lastSeen = Date.now();
          agent.messageCount++;
        }

        const agent = discoveredAgents.get(senderId);
        logMessage(from, content, {
          direction: 'incoming',
          internalId: senderId,
          assignedId: agent?.assignedId
        });

        // Check if this is a task result
        if (content.includes('"taskId"') && content.includes('"results"')) {
          try {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[1]);
              console.log(`\n[✅ RESULT RECEIVED] ${agent?.assignedId} completed ${result.taskId}`);
              logResult(result.taskId, agent?.assignedId, result);

              const task = assignedTasks.get(result.taskId);
              if (task) {
                task.status = 'completed';
                completedTasks.set(result.taskId, result);
                agent.tasksCompleted++;
              }

              // Save result to file
              const resultFile = path.join(OUTPUT_DIR, `${result.taskId}.json`);
              fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
            }
          } catch (e) {
            console.log(`[!] Could not parse result: ${e.message}`);
          }
        }

        // Display message (truncated)
        console.log(`\n[📨 ${agent?.assignedId || from}]:`);
        content.split('\n').slice(0, 5).forEach(line => {
          if (line.trim()) {
            console.log(`    ${line.slice(0, 80)}`);
          }
        });
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  ws.on('error', (err) => {
    console.error('[✗] Error:', err.message);
    logMessage('SYSTEM', `Error: ${err.message}`);
  });

  ws.on('close', () => {
    console.log('\n[!] Connection closed');
    reportStatus();
    process.exit(0);
  });

  // Session timeout
  setTimeout(() => {
    console.log('\n[!] Session timeout');
    logMessage('SYSTEM', 'Session timeout - ending');
    reportStatus();
    ws.close();
  }, SESSION_TIMEOUT);

  process.on('SIGINT', () => {
    console.log('\n[!] Interrupted');
    logMessage('SYSTEM', 'Session interrupted by user');
    reportStatus();
    ws.close();
    process.exit(0);
  });
}

function reportStatus() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     SESSION COMPLETE                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`📝 Full log saved to: ${logFilePath}\n`);

  console.log('Agents:');
  discoveredAgents.forEach((agent) => {
    console.log(`  ${agent.assignedId || '[unassigned]'} - ${agent.name}`);
    console.log(`    Tasks: ${agent.tasksAssigned || 0} assigned, ${agent.tasksCompleted || 0} completed`);
  });

  console.log(`\nTasks:`);
  console.log(`  Total: ${assignedTasks.size}`);
  console.log(`  Completed: ${completedTasks.size}`);
  console.log(`  Pending: ${assignedTasks.size - completedTasks.size}`);

  console.log(`\nDuration: ${Math.round((Date.now() - sessionStartTime) / 1000)}s`);
  console.log(`Total messages: ${sessionLog.messages.length}`);

  saveLog();
}

// ============================================================================
// START
// ============================================================================

initializeOrchestrator();

console.log(`Session: ${SESSION_TIMEOUT / 60000} minutes | Ctrl+C to exit\n`);
