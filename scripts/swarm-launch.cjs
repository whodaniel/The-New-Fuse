const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const RELAY_URL = 'ws://localhost:3001/ws';
const AGENTS_DIR = path.join(__dirname, '../.agent/agents');

async function launchSwarm() {
  console.log('🐝 Launching TNF Agent Swarm...');
  
  const ws = new WebSocket(RELAY_URL);

  ws.on('open', async () => {
    console.log('✅ Connected to TNF Relay');

    // 1. Register Master Orchestrator
    const masterMsg = {
      id: `reg-${Date.now()}-master`,
      type: 'REGISTER',
      source: 'master-orchestrator',
      timestamp: Date.now(),
      payload: {
        type: 'agent',
        id: 'master-orchestrator',
        name: 'TNF Master Orchestrator',
        capabilities: ['orchestration', 'coordination']
      }
    };
    ws.send(JSON.stringify(masterMsg));

    // 2. Register Specialist Agents from .agent/agents/
    const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Found ${agentFiles.length} specialist agents.`);

    for (const file of agentFiles) {
      const agentId = file.replace('.md', '');
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
      
      const capabilities = ['specialist'];
      if (content.includes('coding')) capabilities.push('coding');
      if (content.includes('research')) capabilities.push('research');
      if (content.includes('security')) capabilities.push('security');

      const regMsg = {
        id: `reg-${Date.now()}-${agentId}`,
        type: 'REGISTER',
        source: agentId,
        timestamp: Date.now(),
        payload: {
          type: 'agent',
          id: agentId,
          name: agentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          capabilities: capabilities
        }
      };
      
      ws.send(JSON.stringify(regMsg));
      console.log(`   Registered: ${regMsg.payload.name}`);
      await new Promise(r => setTimeout(resolve => r(resolve), 50));
    }

    console.log('\n🚀 Swarm fully registered and monitoring Relay.');
    
    // Keep connection alive
    setInterval(() => {
      ws.send(JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() }));
    }, 30000);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'MESSAGE_RECEIVE' || msg.type === 'CHANNEL_MESSAGE') {
        const payload = msg.payload;
        console.log(`📩 [${payload.channel || 'direct'}] ${payload.from}: ${payload.content?.substring(0, 100)}`);
      }
    } catch (e) {
      // Ignore malformed
    }
  });

  ws.on('error', (err) => {
    console.error('❌ Relay Connection Error:', err.message);
  });

  ws.on('close', () => {
    console.log('🔌 Disconnected from Relay');
    process.exit(0);
  });
}

launchSwarm().catch(console.error);
