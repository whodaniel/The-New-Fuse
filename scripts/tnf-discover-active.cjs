#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const HEARTBEAT_PATH = path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'state', 'terminal-heartbeat-latest.json');
const REGISTRY_PATH = path.join(os.homedir(), '.tnf', 'session-discovery', 'terminal-identity-registry.json');
const TNF_ROOT = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '..');
const LEDGER_PATH = path.join(TNF_ROOT, 'docs', 'protocols', 'AGENT_STATUS_LEDGER.md');

function discover() {
  console.log('=== TNF Swarm Discovery ===\n');

  // 1. Terminal Activity (Liveness)
  if (fs.existsSync(HEARTBEAT_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(HEARTBEAT_PATH, 'utf8'));
      console.log(`Liveness Actor: ${data.actor.id}`);
      console.log(`Last Pulse: ${data.generatedAt}`);
      console.log(`Observed Terminals: ${data.summary.observedSessions}`);
      
      if (data.observed && data.observed.length > 0) {
        console.log('\nActive Terminal Sessions:');
        data.observed.forEach(s => {
          if (s.agentLike) {
            console.log(`- ${s.agentId} [${s.tty}] CWD: ${s.cwd || 'unknown'}`);
            console.log(`  Cmd: ${s.foregroundCommand} ${s.foregroundArgs}`);
          }
        });
      }
    } catch (e) {
      console.error('Error reading heartbeat:', e.message);
    }
  }

  // 2. Task Ledger (Semantic)
  if (fs.existsSync(LEDGER_PATH)) {
    try {
      const ledger = fs.readFileSync(LEDGER_PATH, 'utf8');
      console.log('\nActive Task Ledger:');
      const lines = ledger.split('\n');
      const activeTasks = lines.filter(l => l.includes('✅') || l.includes('🚧') || l.includes('⏳'));
      activeTasks.forEach(t => console.log(t));
    } catch (e) {
      console.error('Error reading ledger:', e.message);
    }
  }

  console.log('\n=== End Discovery ===');
}

discover();
