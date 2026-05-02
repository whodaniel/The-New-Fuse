#!/usr/bin/env node
/**
 * Send Improvement Task to Green Channel
 * Broadcasts a collaborative improvement task to all connected agents
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const ORCHESTRATOR_ID = 'orchestrator-antigravity-task';
const CHANNEL_ID = 'channel-1768617361721'; // Green channel

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected - sending improvement task...');

  // Register
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: ORCHESTRATOR_ID,
      payload: {
        agent: {
          id: ORCHESTRATOR_ID,
          name: 'Task Dispatcher',
          status: 'active',
          capabilities: ['task-dispatch'],
        },
      },
    })
  );

  // Join channel
  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: ORCHESTRATOR_ID,
        payload: { channelId: CHANNEL_ID },
      })
    );
  }, 500);

  // Send improvement task
  setTimeout(() => {
    const task = `
═══════════════════════════════════════════════════════════════
🔧 COLLABORATIVE IMPROVEMENT TASK - PRIORITY: HIGH
═══════════════════════════════════════════════════════════════
Task ID: improvement-cycle-001
Timestamp: ${new Date().toISOString()}
Orchestrator: Antigravity

📋 MISSION: Enter Continuous Self-Improvement Cycle

We are beginning a systematic audit and enhancement of The New Fuse framework.

📍 PHASE 1: ARCHITECTURE MAPPING

Each agent, please analyze and report on ONE of the following:

**AGENT-01 Assignment:**
Analyze the \`packages/a2a-core\` package:
- Review the A2A protocol implementation (v0.3.0)
- Check alignment with our DACC-v1 protocol
- Identify integration opportunities
- Report any deprecated or missing functionality

**AGENT-02 Assignment:**
Analyze the \`packages/agent\` package:
- Review the RedisAgentRegistry implementation
- Check agent metadata management
- Identify enhancement opportunities
- Report on current vs. required capabilities

📌 DELIVERABLES (Per Agent)

1. **Summary** - One paragraph overview
2. **Findings** - Bullet list of observations
3. **Recommendations** - Prioritized improvement suggestions
4. **Blockers** - Any issues that need immediate attention

🔔 REMEMBER: Sign all responses with [AGENT-XX]!

⏱️ DEADLINE: Complete initial analysis within this session.

═══════════════════════════════════════════════════════════════
`;

    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: ORCHESTRATOR_ID,
        channel: CHANNEL_ID,
        payload: {
          to: 'broadcast',
          content: task,
          messageType: 'improvement_task',
          metadata: {
            taskId: 'improvement-cycle-001',
            priority: 'high',
            protocol: 'DACC-v1',
          },
        },
      })
    );

    console.log('✓ Improvement task sent to Green channel');
    console.log('  Waiting for agents to process...');
  }, 1000);

  // Disconnect after sending
  setTimeout(() => {
    console.log('✓ Task dispatched successfully');
    ws.close();
    process.exit(0);
  }, 2000);
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
