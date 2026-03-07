#!/usr/bin/env node
/**
 * Session Control Commands
 * Pause, Resume, or End the current agent session
 *
 * Usage:
 *   node session-control.js pause   - Request agents to pause
 *   node session-control.js resume  - Request agents to resume
 *   node session-control.js end     - End the session
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768617361721'; // Green channel

const command = process.argv[2] || 'status';

const messages = {
  pause: `
═══════════════════════════════════════════════════════════════
⏸️ SESSION PAUSE REQUESTED
═══════════════════════════════════════════════════════════════

**ALL AGENTS: Please PAUSE current operations.**

Reason: Orchestrator pause request
Time: ${new Date().toISOString()}

Instructions:
1. Complete your current sentence/thought
2. Save any work-in-progress state
3. Await RESUME command before continuing

Reply with: [AGENT-XX] PAUSED - <current state summary>

═══════════════════════════════════════════════════════════════
`,
  resume: `
═══════════════════════════════════════════════════════════════
▶️ SESSION RESUME
═══════════════════════════════════════════════════════════════

**ALL AGENTS: Please RESUME operations.**

Time: ${new Date().toISOString()}

You may continue from where you paused.
Reply with: [AGENT-XX] RESUMED - <continuing action>

═══════════════════════════════════════════════════════════════
`,
  end: `
═══════════════════════════════════════════════════════════════
🔴 SESSION ENDING
═══════════════════════════════════════════════════════════════

**ALL AGENTS: Session is ending.**

Time: ${new Date().toISOString()}

Instructions:
1. Complete immediate work
2. Provide final summary if applicable
3. Await next session

Thank you for your participation.

═══════════════════════════════════════════════════════════════
`,
  status: `
═══════════════════════════════════════════════════════════════
📊 STATUS CHECK
═══════════════════════════════════════════════════════════════

**ALL AGENTS: Report current status.**

Time: ${new Date().toISOString()}

Reply with: [AGENT-XX] STATUS - <current task/state>

═══════════════════════════════════════════════════════════════
`,
};

if (!messages[command]) {
  console.log('Usage: node session-control.js <pause|resume|end|status>');
  process.exit(1);
}

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: 'session-control',
      payload: { agent: { id: 'session-control', name: 'Session Controller', status: 'active' } },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: 'session-control',
        payload: { channelId: CHANNEL_ID },
      })
    );
  }, 200);

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: 'session-control',
        channel: CHANNEL_ID,
        payload: {
          to: 'broadcast',
          content: messages[command],
          messageType: `session_${command}`,
        },
      })
    );
    console.log(`✓ ${command.toUpperCase()} command sent to Green channel`);
  }, 400);

  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 1000);
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
