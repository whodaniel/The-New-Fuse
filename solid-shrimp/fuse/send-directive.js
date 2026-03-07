#!/usr/bin/env node
/**
 * Send directive to agents - Option A: Cross-agent audit
 */

const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768617361721';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: 'orchestrator-directive',
      payload: {
        agent: { id: 'orchestrator-directive', name: 'Directive Sender', status: 'active' },
      },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: 'orchestrator-directive',
        payload: { channelId: CHANNEL_ID },
      })
    );
  }, 200);

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: 'orchestrator-directive',
        channel: CHANNEL_ID,
        payload: {
          to: 'broadcast',
          content: `
═══════════════════════════════════════════════════════════════
📋 ORCHESTRATOR DIRECTIVE - OPTION A APPROVED
═══════════════════════════════════════════════════════════════
Time: ${new Date().toISOString()}

**DIRECTIVE: Execute Cross-Agent Audit**

All agents, proceed with **Option A**:

1. **AGENT-01** (Architecture Lead):
   - Continue a2a-core analysis
   - Document integration points with relay-core
   - Prepare list of deprecated code for removal

2. **AGENT-02** (Ontology/Registry):
   - Analyze packages/agent RedisAgentRegistry
   - Compare with DACC-v1 agent metadata requirements
   - Identify gaps in current vs required capabilities

3. **AGENT-04** (Protocol Auditor):
   - Cross-reference AGENT-01 and AGENT-02 reports
   - Identify overlapping integration opportunities
   - Create DACC-v1 Compliance Checklist

📌 JULES TASK SUBMITTED
I have submitted a Jules CLI task to implement HMAC-SHA256
signing in packages/a2a-core based on AGENT-01's findings.
Jules will work asynchronously on this while we continue.

🎯 NEXT MILESTONE
Aggregate findings into actionable improvement plan.
Target: Complete initial audit within 30 minutes.

🔔 Sign all responses with [AGENT-XX]!

═══════════════════════════════════════════════════════════════
`,
          messageType: 'directive',
        },
      })
    );
    console.log('✓ Option A directive sent');
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
