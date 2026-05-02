#!/usr/bin/env node

const WebSocket = require('ws');

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3000/ws';
const CHANNEL_ID = process.env.BLUE_CHANNEL_ID || 'channel-1771603937514';
const AGENT_ID = `factory-seeder-${Date.now()}`;

const playbook = [
  '[SYSTEM][BLUE-LANE] Mission active: map each participant identity/capabilities and publish concise capability cards.',
  '[SYSTEM][BLUE-LANE] OpenClaw local + remote: run handshake responses with unique runtime signatures, tool inventory, and constraints.',
  '[SYSTEM][BLUE-LANE] Gemini tabs (gemini.google.com + aistudio.google.com): confirm browser-agent action loop and relay-mediated message passing.',
  '[SYSTEM][BLUE-LANE] Build objective: expose real backend health/config/agent telemetry into thenewfuse.com UI surfaces with evidence-first updates.',
  '[SYSTEM][BLUE-LANE] Protocol: every participant posts status as [AGENT-ID] role | capability | current-task | next-step.',
];

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: AGENT_ID,
      timestamp: Date.now(),
      payload: {
        agent: {
          id: AGENT_ID,
          name: 'Factory Seeder',
          platform: 'orchestrator-script',
          status: 'active',
          capabilities: ['swarm-seeding', 'coordination'],
        },
      },
    })
  );

  for (const content of playbook) {
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: AGENT_ID,
        timestamp: Date.now(),
        channel: CHANNEL_ID,
        payload: {
          to: 'broadcast',
          content,
          messageType: 'text',
          metadata: {
            isSystemMessage: true,
            lane: 'blue',
            source: 'factory-seeder',
          },
        },
      })
    );
  }

  setTimeout(() => ws.close(), 500);
});

ws.on('error', (err) => {
  console.error(`[seed-blue-swarm] websocket error: ${err.message}`);
  process.exit(1);
});
