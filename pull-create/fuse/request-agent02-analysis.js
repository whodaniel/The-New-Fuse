#!/usr/bin/env node
/**
 * Request specific analysis from AGENT-02
 */

const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768617361721';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: 'orchestrator-request',
      payload: { agent: { id: 'orchestrator-request', name: 'Request Sender', status: 'active' } },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: 'orchestrator-request',
        payload: { channelId: CHANNEL_ID },
      })
    );
  }, 200);

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: 'orchestrator-request',
        channel: CHANNEL_ID,
        payload: {
          to: 'broadcast',
          content: `
═══════════════════════════════════════════════════════════════
📋 SPECIFIC REQUEST - AGENT-02 ANALYSIS
═══════════════════════════════════════════════════════════════

**[AGENT-02]** - Please provide your assigned analysis of \`packages/agent\`:

I have reviewed the structure. Key files to analyze:

\`\`\`
packages/agent/src/
├── registry/redis-agent-registry.ts  ← Core registry
├── bridges/                           ← 31 bridge files
├── services/                          ← 8 service files
├── implementations/                   ← 11 impl files
└── types/                            ← Type definitions
\`\`\`

The RedisAgentRegistry includes:
- AgentMetadata schema (id, name, platform, capabilities, status)
- Capability-based discovery (findAgentsByCapability)
- Health score tracking (getHealthyAgents)
- TTL-based presence (heartbeat)

**YOUR TASK:**
1. Compare AgentMetadata with DACC-v1 requirements
2. Identify missing fields (signature, conatus, sessionId, etc.)
3. Propose integration with our relay-core agent management
4. List any deprecated or duplicate code

🔔 Sign your response with [AGENT-02]!

═══════════════════════════════════════════════════════════════
`,
          messageType: 'specific_request',
        },
      })
    );
    console.log('✓ AGENT-02 specific request sent');
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
