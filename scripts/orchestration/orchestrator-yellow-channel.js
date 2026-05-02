#!/usr/bin/env node
/**
 * Antigravity Orchestrator - Yellow Channel
 * Advanced Multi-Agent Coordination Protocol
 *
 * Features:
 * - Agent Discovery Protocol
 * - Context Distribution
 * - Media Transfer Testing
 * - Structured Data Exchange
 *
 * Run with: node orchestrator-yellow-channel.js
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const ORCHESTRATOR_ID = 'orchestrator-antigravity-yellow';
const CHANNEL_NAME = 'yellow';

// Track discovered agents
const discoveredAgents = new Map();
let channelId = null;
const sessionStartTime = Date.now();

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     ANTIGRAVITY ORCHESTRATOR - YELLOW CHANNEL              ║');
console.log('║     Multi-Agent Discovery & Coordination Protocol          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`Connecting to relay at ${RELAY_URL}...`);

const ws = new WebSocket(RELAY_URL);

// === PROTOCOL FUNCTIONS ===

/**
 * Send a structured protocol message
 */
function sendProtocolMessage(type, payload, metadata = {}) {
  const msg = {
    id: `proto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    timestamp: Date.now(),
    source: ORCHESTRATOR_ID,
    channel: channelId,
    payload: {
      ...payload,
      metadata: {
        ...metadata,
        protocol: 'DACC-v1',
        orchestrator: ORCHESTRATOR_ID,
        sessionId: `session-${sessionStartTime}`,
      },
    },
  };
  ws.send(JSON.stringify(msg));
  return msg.id;
}

/**
 * DISCOVERY PROTOCOL - Phase 1: Agent Discovery
 * Broadcasts a discovery request to identify all connected agents
 */
function initiateDiscovery() {
  console.log('\n[PROTOCOL] Phase 1: Initiating Agent Discovery...\n');

  sendProtocolMessage(
    'MESSAGE_SEND',
    {
      to: 'broadcast',
      content: `[DISCOVERY REQUEST]
Protocol: DACC-v1 (Distributed Agent Communication & Coordination)
Orchestrator: Antigravity (${ORCHESTRATOR_ID})
Channel: ${CHANNEL_NAME}
Timestamp: ${new Date().toISOString()}

ALL AGENTS: Please acknowledge by responding with your:
1. Agent ID
2. Agent Name/Type
3. Capabilities (what you can do)
4. Current status
5. Platform/Environment

This is a formal discovery request. Please respond within 30 seconds.`,
      messageType: 'discovery_request',
    },
    { phase: 'discovery', requiresResponse: true }
  );

  // Wait for responses then move to context phase
  setTimeout(() => {
    reportDiscoveryResults();
    initiateContextDistribution();
  }, 35000);
}

/**
 * Report discovery results
 */
function reportDiscoveryResults() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║     DISCOVERY RESULTS                 ║');
  console.log('╚═══════════════════════════════════════╝\n');

  if (discoveredAgents.size === 0) {
    console.log('No agents have responded yet.');
  } else {
    discoveredAgents.forEach((agent, id) => {
      console.log(`  [${agent.name || 'Unknown'}]`);
      console.log(`    ID: ${id}`);
      console.log(`    Platform: ${agent.platform || 'unknown'}`);
      console.log(`    Last seen: ${new Date(agent.lastSeen).toLocaleTimeString()}`);
      console.log('');
    });
  }
}

/**
 * CONTEXT PROTOCOL - Phase 2: Context Distribution
 * Distributes shared context to all discovered agents
 */
function initiateContextDistribution() {
  console.log('\n[PROTOCOL] Phase 2: Context Distribution...\n');

  const sharedContext = {
    mission: 'Test multi-agent coordination and data transfer capabilities',
    objectives: [
      'Verify text message transfer between agents',
      'Test structured data (JSON) transfer',
      'Explore media link sharing capabilities',
      'Document protocol effectiveness',
      'Identify limitations and edge cases',
    ],
    sessionInfo: {
      startTime: new Date(sessionStartTime).toISOString(),
      orchestrator: ORCHESTRATOR_ID,
      channel: CHANNEL_NAME,
      protocol: 'DACC-v1',
    },
    roles: {
      orchestrator: 'Coordinates tasks, maintains context, tracks progress',
      pageAgents: 'Execute tasks, provide AI compute, report results',
    },
  };

  sendProtocolMessage(
    'MESSAGE_SEND',
    {
      to: 'broadcast',
      content: `[CONTEXT DISTRIBUTION]
Protocol Phase: Context Sync

=== SHARED SESSION CONTEXT ===

${JSON.stringify(sharedContext, null, 2)}

=== END CONTEXT ===

All agents should now have the same understanding of:
- Our mission and objectives
- Session information
- Role definitions

Please acknowledge receipt and confirm you understand the mission.`,
      messageType: 'context_distribution',
    },
    { phase: 'context', sharedContext }
  );

  // Move to testing phase
  setTimeout(() => {
    initiateDataTransferTests();
  }, 20000);
}

/**
 * TESTING PROTOCOL - Phase 3: Data Transfer Tests
 * Tests various types of data transfer
 */
function initiateDataTransferTests() {
  console.log('\n[PROTOCOL] Phase 3: Data Transfer Testing...\n');

  // Test 1: Structured JSON
  console.log('  Test 1: Structured JSON transfer...');
  sendProtocolMessage(
    'MESSAGE_SEND',
    {
      to: 'broadcast',
      content: `[TEST 1: STRUCTURED DATA]

I am sending a structured data object. Please confirm you received it correctly.

\`\`\`json
{
  "testId": "json-transfer-001",
  "testType": "structured_data",
  "payload": {
    "numbers": [1, 2, 3, 4, 5],
    "nested": {
      "key1": "value1",
      "key2": true,
      "key3": null
    },
    "timestamp": "${new Date().toISOString()}"
  },
  "checksum": "verify-json-intact"
}
\`\`\`

Respond with: "JSON received correctly" or describe any issues.`,
      messageType: 'test_structured_data',
    },
    { testId: 'json-transfer-001', testType: 'structured_data' }
  );

  // Test 2: URL/Link transfer
  setTimeout(() => {
    console.log('  Test 2: URL/Link transfer...');
    sendProtocolMessage(
      'MESSAGE_SEND',
      {
        to: 'broadcast',
        content: `[TEST 2: URL TRANSFER]

Testing URL and link transfer capabilities. Please confirm these links are visible:

1. YouTube Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
2. GitHub Repo: https://github.com/whodaniel/fuse
3. Documentation: https://docs.example.com/api/v1/endpoints

Respond with which links you can see and if they are formatted correctly.`,
        messageType: 'test_url_transfer',
      },
      { testId: 'url-transfer-001', testType: 'url_transfer' }
    );
  }, 10000);

  // Test 3: Code block transfer
  setTimeout(() => {
    console.log('  Test 3: Code block transfer...');
    sendProtocolMessage(
      'MESSAGE_SEND',
      {
        to: 'broadcast',
        content: `[TEST 3: CODE TRANSFER]

Testing code block formatting and transfer:

\`\`\`typescript
interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'offline';
}

function discoverAgents(channel: string): Agent[] {
  return connectedAgents.filter(a => a.channels.includes(channel));
}
\`\`\`

Can you see the TypeScript code above with proper syntax? Please confirm.`,
        messageType: 'test_code_transfer',
      },
      { testId: 'code-transfer-001', testType: 'code_transfer' }
    );
  }, 20000);

  // Final summary request
  setTimeout(() => {
    console.log('  Requesting test summary from agents...');
    sendProtocolMessage(
      'MESSAGE_SEND',
      {
        to: 'broadcast',
        content: `[TEST SUMMARY REQUEST]

All tests have been sent. Please provide a summary:

1. Which tests did you receive successfully?
2. Were there any formatting issues?
3. Did any data appear corrupted or truncated?
4. What is your assessment of the communication channel quality?

This information will help improve the DACC protocol.`,
        messageType: 'test_summary_request',
      },
      { phase: 'summary' }
    );
  }, 35000);
}

// === EVENT HANDLERS ===

ws.on('open', () => {
  console.log('[✓] Connected to relay\n');

  // 1. Register as Orchestrator
  ws.send(
    JSON.stringify({
      id: `reg-${Date.now()}`,
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: ORCHESTRATOR_ID,
      payload: {
        agent: {
          id: ORCHESTRATOR_ID,
          name: 'Antigravity Orchestrator (Yellow)',
          platform: 'cli-orchestrator',
          status: 'active',
          capabilities: [
            'orchestration',
            'discovery',
            'context-distribution',
            'task-dispatch',
            'coordination',
          ],
          channels: [],
          metadata: {
            role: 'orchestrator',
            protocol: 'DACC-v1',
            version: '1.0.0',
          },
        },
      },
    })
  );
  console.log('[✓] Registered as Antigravity Orchestrator');

  // 2. Create/Join Yellow Channel
  setTimeout(() => {
    // First try to create the channel
    ws.send(
      JSON.stringify({
        id: `create-${Date.now()}`,
        type: 'CHANNEL_CREATE',
        timestamp: Date.now(),
        source: ORCHESTRATOR_ID,
        payload: {
          name: CHANNEL_NAME,
          isPrivate: false,
          metadata: {
            purpose: 'Multi-agent coordination testing',
            protocol: 'DACC-v1',
          },
        },
      })
    );
    console.log(`[✓] Creating/Joining Yellow channel...`);
  }, 500);

  // 3. Start discovery protocol after channel join confirmed
  setTimeout(() => {
    if (!channelId) {
      channelId = `channel-${CHANNEL_NAME}`;
      console.log(`[!] Using fallback channel ID: ${channelId}`);
    }
    initiateDiscovery();
  }, 2000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());

    // Track channel creation response
    if (msg.type === 'CHANNEL_CREATED' || msg.type === 'CHANNEL_JOIN_SUCCESS') {
      channelId = msg.payload?.channelId || msg.payload?.channel?.id;
      console.log(`[✓] Channel confirmed: ${channelId}`);
    }

    // Process incoming messages
    if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
      const from = msg.payload?.from || msg.source || 'unknown';
      const content = msg.payload?.content || '';
      const senderId = msg.payload?.metadata?.senderId || from;

      // Skip our own messages
      if (from === ORCHESTRATOR_ID || senderId === ORCHESTRATOR_ID) {
        return;
      }

      // Track discovered agents
      if (!discoveredAgents.has(senderId)) {
        discoveredAgents.set(senderId, {
          id: senderId,
          name: from,
          platform: msg.payload?.metadata?.platform || 'unknown',
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          messageCount: 1,
        });
        console.log(`\n[🆕 NEW AGENT] ${from} (${senderId})`);
      } else {
        const agent = discoveredAgents.get(senderId);
        agent.lastSeen = Date.now();
        agent.messageCount++;
      }

      // Display message
      console.log(`\n[📨 ${from}]:`);
      const lines = content.split('\n').slice(0, 10);
      lines.forEach((line) => console.log(`    ${line}`));
      if (content.split('\n').length > 10) {
        console.log('    ... (message truncated for display)');
      }
    }

    // Track agent status updates
    if (msg.type === 'AGENT_STATUS' || msg.type === 'AGENT_REGISTERED') {
      const agent = msg.payload?.agent;
      if (agent && agent.id !== ORCHESTRATOR_ID) {
        console.log(`[👤 Agent Update]: ${agent.name} (${agent.id}) - ${agent.status}`);
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
});

ws.on('error', (err) => {
  console.error('[✗] Connection error:', err.message);
});

ws.on('close', () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     SESSION COMPLETE                   ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log(`Total agents discovered: ${discoveredAgents.size}`);
  console.log(`Session duration: ${Math.round((Date.now() - sessionStartTime) / 1000)}s`);
  process.exit(0);
});

// Session timeout - 5 minutes for full protocol execution
const SESSION_DURATION = 300000; // 5 minutes

setTimeout(() => {
  console.log('\n[!] Session timeout - generating final report...\n');
  reportDiscoveryResults();
  ws.close();
}, SESSION_DURATION);

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n[!] Interrupted - generating report and closing...');
  reportDiscoveryResults();
  ws.close();
  process.exit(0);
});

console.log(`\nSession will run for ${SESSION_DURATION / 1000} seconds.`);
console.log('Press Ctrl+C to end early and see results.\n');
