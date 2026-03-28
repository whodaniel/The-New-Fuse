#!/usr/bin/env node
/**
 * TNF MASTER ORCHESTRATOR - Simple Version
 *
 * Demonstrates the full TNF ecosystem working together.
 */

const WebSocket = require('ws');
const http = require('http');
const https = require('https');

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  localRelay: 'ws://localhost:3001/ws',
  localRelayHealth: 'http://localhost:3001/health',
  cloudApi: 'https://thenewfuse.com/api/health',
  cloudIde: 'https://ide.thenewfuse.com',
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data.substring(0, 100) });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function checkRedis() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('redis-cli ping', { timeout: 3000 }, (err, stdout) => {
      if (err) {
        resolve({ status: 'offline', error: err.message });
      } else {
        resolve({ status: stdout.trim() === 'PONG' ? 'online' : 'unknown', data: stdout.trim() });
      }
    });
  });
}

// ============================================================
// BANNER
// ============================================================

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ████████╗██╗  ██╗███████╗    ███╗   ██╗███████╗██╗    ██╗                   ║
║   ╚══██╔══╝██║  ██║██╔════╝    ████╗  ██║██╔════╝██║    ██║                   ║
║      ██║   ███████║█████╗      ██╔██╗ ██║█████╗  ██║ █╗ ██║                   ║
║      ██║   ██╔══██║██╔══╝      ██║╚██╗██║██╔══╝  ██║███╗██║                   ║
║      ██║   ██║  ██║███████╗    ██║ ╚████║███████╗╚███╔███╔╝                   ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝                    ║
║                                                                              ║
║          ███████╗██╗   ██╗███████╗███████╗                                   ║
║          ██╔════╝██║   ██║██╔════╝██╔════╝                                   ║
║          █████╗  ██║   ██║███████╗█████╗                                     ║
║          ██╔══╝  ██║   ██║╚════██║██╔══╝                                     ║
║          ██║     ╚██████╔╝███████║███████╗                                   ║
║          ╚═╝      ╚═════╝ ╚══════╝╚══════╝                                   ║
║                                                                              ║
║              🤖 MASTER ORCHESTRATOR - Unified Agentic Ecosystem 🤖           ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('\n🚀 Starting TNF Master Orchestrator...\n');
  console.log('═══ PHASE 1: System Health Check ═══\n');

  const results = {};

  // Check Local Relay
  try {
    const relay = await fetchJson(CONFIG.localRelayHealth);
    results.localRelay = { status: 'online', ...relay.data };
    console.log(`✅ Local Relay: ONLINE`);
    console.log(
      `   └─ Agents: ${relay.data.agents}, Channels: ${relay.data.channels}, Uptime: ${Math.floor(relay.data.uptime)}s`
    );
  } catch (err) {
    results.localRelay = { status: 'offline', error: err.message };
    console.log(`❌ Local Relay: OFFLINE (${err.message})`);
  }

  // Check Redis
  const redis = await checkRedis();
  results.redis = redis;
  console.log(`${redis.status === 'online' ? '✅' : '❌'} Redis: ${redis.status.toUpperCase()}`);

  // Check Cloud API
  try {
    const api = await fetchJson(CONFIG.cloudApi);
    results.cloudApi = { status: 'online', ...api.data };
    console.log(`✅ Cloud API (thenewfuse.com): ONLINE`);
    console.log(`   └─ Uptime: ${Math.floor(api.data.uptime)}s`);
  } catch (err) {
    results.cloudApi = { status: 'offline', error: err.message };
    console.log(`❌ Cloud API: OFFLINE (${err.message})`);
  }

  // Check Cloud IDE
  try {
    const ide = await fetchJson(CONFIG.cloudIde);
    results.cloudIde = { status: 'online' };
    console.log(`✅ Cloud IDE (ide.thenewfuse.com): ONLINE`);
  } catch (err) {
    results.cloudIde = { status: 'offline', error: err.message };
    console.log(`❌ Cloud IDE: OFFLINE (${err.message})`);
  }

  console.log('\n═══ PHASE 2: Connecting to Communication Backbone ═══\n');

  // Connect to WebSocket Relay
  let wsConnected = false;
  let agentCount = 0;

  const ws = new WebSocket(CONFIG.localRelay);

  ws.on('open', () => {
    wsConnected = true;
    console.log('✅ Connected to Local Relay WebSocket');

    // Register as orchestrator
    ws.send(
      JSON.stringify({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'AGENT_REGISTER',
        source: 'master-orchestrator',
        timestamp: Date.now(),
        payload: {
          agent: {
            id: 'master-orchestrator',
            name: 'TNF Master Orchestrator',
            platform: 'node-cli',
            status: 'active',
            capabilities: ['orchestration', 'monitoring', 'self-improvement'],
            channels: ['general', 'orchestration'],
          },
        },
      })
    );
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    switch (msg.type) {
      case 'WELCOME':
        console.log('📨 Received WELCOME from relay');
        break;
      case 'AGENT_LIST':
        const agents = msg.payload?.agents || [];
        agentCount = agents.length;
        console.log(`\n📋 Active Agents (${agents.length}):`);
        agents.forEach((a, i) => {
          console.log(`   ${i + 1}. ${a.name} (${a.platform}) - ${a.status}`);
        });
        break;
      case 'CHANNEL_LIST':
        const channels = msg.payload?.channels || [];
        console.log(`\n📋 Available Channels (${channels.length}):`);
        channels.forEach((c, i) => {
          console.log(`   ${i + 1}. #${c.name} - ${c.description || 'No description'}`);
        });
        break;
      case 'MESSAGE_RECEIVE':
      case 'CHANNEL_MESSAGE':
        const payload = msg.payload;
        console.log(
          `💬 [${payload.channel || 'direct'}] ${payload.from}: ${payload.content?.substring(0, 60)}...`
        );
        break;
      case 'AGENT_STATUS':
        const agent = msg.payload?.agent;
        console.log(`👤 Agent ${agent.name} is now ${agent.status}`);
        break;
    }
  });

  ws.on('error', (err) => {
    console.log(`⚠️ WebSocket error: ${err.message}`);
  });

  // Wait for initial data
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\n═══ PHASE 3: Self-Improvement Loop ═══\n');
  console.log('🔄 Self-improvement loop would be triggered by Railway cron jobs');
  console.log('   └─ Cron schedule: Every hour for health checks');
  console.log('   └─ Cron schedule: Daily for optimization analysis');
  console.log('   └─ Cron schedule: Weekly for deep system review');

  console.log('\n═══ PHASE 4: System Status ═══\n');

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           TNF ECOSYSTEM STATUS                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ INFRASTRUCTURE SERVICES                                                      ║
║   ${results.localRelay.status === 'online' ? '✅' : '❌'} Local Relay Server      ${results.localRelay.status.toUpperCase().padEnd(10)} (ws://localhost:3001)   ║
║   ${results.redis.status === 'online' ? '✅' : '❌'} Redis Server             ${results.redis.status.toUpperCase().padEnd(10)} (localhost:6379)        ║
║   ${results.cloudApi.status === 'online' ? '✅' : '❌'} Cloud API               ${results.cloudApi.status.toUpperCase().padEnd(10)} (thenewfuse.com)        ║
║   ${results.cloudIde.status === 'online' ? '✅' : '❌'} Cloud IDE (SkIDEancer)       ${results.cloudIde.status.toUpperCase().padEnd(10)} (ide.thenewfuse.com)    ║
║                                                                              ║
║ DESKTOP & EXTENSION APPS                                                     ║
║   ❓ Chrome Extension       CHECK      (chrome://extensions)                 ║
║   ❓ VSCode Extension       CHECK      (VS Code Extensions panel)            ║
║   ❓ Electron Desktop       CHECK      (apps/electron-desktop)               ║
║   ❓ Tauri Desktop          CHECK      (apps/tauri-desktop)                  ║
║                                                                              ║
║ ACTIVE AGENTS: ${String(agentCount).padEnd(3)}                                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ COMMUNICATION CHANNELS                                                       ║
║   📡 WebSocket Relay     -> Multi-agent real-time messaging                 ║
║   📡 Redis Pub/Sub       -> Cross-instance coordination                     ║
║   📡 Cloud Sandbox CDP   -> Remote browser automation                       ║
║   📡 Live View Stream    -> Human monitoring of AI activities               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ AVAILABLE CLI COMMANDS                                                       ║
║   pnpm relay:start       -> Start local relay server                        ║
║   pnpm build:chrome      -> Build Chrome extension                          ║
║   pnpm dev:frontend      -> Start frontend dev server                       ║
║   pnpm dev:api           -> Start API server                                ║
║   jules delegate         -> Delegate tasks to Jules AI                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  // Demonstrate message sending
  console.log('\n═══ DEMONSTRATION: Sending Test Messages ═══\n');

  if (wsConnected) {
    // Broadcast message
    ws.send(
      JSON.stringify({
        id: `${Date.now()}-demo1`,
        type: 'MESSAGE_SEND',
        source: 'master-orchestrator',
        channel: 'general',
        timestamp: Date.now(),
        payload: {
          to: 'broadcast',
          content:
            '🎯 Master Orchestrator is now monitoring the TNF ecosystem. All systems operational.',
          messageType: 'text',
        },
      })
    );
    console.log('📤 Sent broadcast message to #general channel');

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('\n✅ TNF Master Orchestrator demonstration complete!\n');
  console.log('💡 To see the full ecosystem in action:');
  console.log('   1. Open Chrome with Fuse Connect extension');
  console.log('   2. Open VS Code with TNF extension');
  console.log('   3. Visit https://thenewfuse.com for the web interface');
  console.log('   4. Visit https://ide.thenewfuse.com for Cloud IDE');
  console.log('   5. Run apps/cloud-sandbox for headless browser control\n');

  // Keep running for a bit to receive messages
  console.log('🎯 Listening for messages (press Ctrl+C to stop)...\n');

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Master Orchestrator...');
    ws.close();
    process.exit(0);
  });
}

main().catch(console.error);
