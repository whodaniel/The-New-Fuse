#!/usr/bin/env node
/**
 * Diagnostic Script - Identify Active Browser Agents
 *
 * This script helps identify which Gemini browser tabs are still
 * running the OLD extension code that has the auto-continue bug.
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const AGENT_ID = 'diagnostic-' + Date.now();

console.log('═══════════════════════════════════════════════════════════');
console.log('  BROWSER AGENT DIAGNOSTIC TOOL');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('🔍 Connecting to relay server...');
console.log(`📡 Relay URL: ${RELAY_URL}\n`);

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('✅ Connected to relay server\n');

  // Register
  const registerMsg = {
    type: 'AGENT_REGISTER',
    payload: {
      name: 'Browser Agent Diagnostic',
      platform: 'diagnostic',
      capabilities: ['monitoring'],
    },
  };

  ws.send(JSON.stringify(registerMsg));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'AGENT_REGISTERED':
        console.log('✅ Diagnostic agent registered\n');
        console.log('📋 ACTIVE AGENTS ON RELAY SERVER:');
        console.log('─'.repeat(60));
        break;

      case 'AGENT_LIST':
        if (message.agents && Array.isArray(message.agents)) {
          const browserAgents = message.agents.filter((a) => a.id && a.id.startsWith('browser-'));

          if (browserAgents.length === 0) {
            console.log('✅ No browser agents currently connected');
            console.log('   (The auto-continue bug should be resolved)\n');
          } else {
            console.log(`⚠️  Found ${browserAgents.length} browser agent(s):\n`);

            browserAgents.forEach((agent) => {
              const agentAge = Date.now() - parseInt(agent.id.split('-')[1]);
              const ageHours = Math.floor(agentAge / (1000 * 60 * 60));
              const ageMinutes = Math.floor((agentAge % (1000 * 60 * 60)) / (1000 * 60));

              console.log(`🌐 Agent ID: ${agent.id}`);
              console.log(`   Name: ${agent.name || 'Unknown'}`);
              console.log(`   Platform: ${agent.platform || 'Unknown'}`);
              console.log(`   Age: ${ageHours}h ${ageMinutes}m (registered ${ageHours} hours ago)`);

              if (ageHours > 1) {
                console.log(`   ⚠️  WARNING: This agent is OLD and likely running buggy code!`);
                console.log(`   👉 ACTION REQUIRED: Refresh the Gemini tab for this agent`);
              }

              console.log();
            });

            console.log('─'.repeat(60));
            console.log('\n📝 INSTRUCTIONS TO FIX:');
            console.log('1. Go to chrome://extensions in your browser');
            console.log('2. Find "The New Fuse" extension and click RELOAD');
            console.log('3. Close ALL Gemini tabs (or hard refresh with Cmd+Shift+R)');
            console.log('4. Open fresh Gemini tabs');
            console.log('5. Re-run this diagnostic to verify browser agents are gone\n');
          }

          // Close after showing results
          setTimeout(() => {
            console.log('✅ Diagnostic complete. Disconnecting...\n');
            ws.close();
          }, 1000);
        }
        break;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('👋 Disconnected from relay server');
  process.exit(0);
});

// Timeout if no response
setTimeout(() => {
  console.log('\n⏱️  Timeout waiting for agent list');
  console.log('   Make sure the relay server is running on port 3001');
  process.exit(1);
}, 5000);
