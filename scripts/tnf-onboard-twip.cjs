#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const HEARTBEAT_PATH = path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'state', 'terminal-heartbeat-latest.json');

function getTwid() {
  if (process.env.TNF_TWID) return process.env.TNF_TWID;
  try {
    // Try to get the TTY of the parent process (the shell)
    const result = spawnSync('ps', ['-p', process.ppid, '-o', 'tty='], { encoding: 'utf8' });
    let tty = result.stdout.trim();
    if (!tty || tty === '??') {
       // Fallback to current process
       const selfResult = spawnSync('ps', ['-p', process.pid, '-o', 'tty='], { encoding: 'utf8' });
       tty = selfResult.stdout.trim();
    }
    const normalized = tty.replace(/^\/dev\//, '').replace(/[^a-zA-Z0-9_-]/g, '-');
    return normalized ? `tnf-local-terminal-${normalized}` : 'tnf-local-terminal-unknown';
  } catch (e) {
    return 'tnf-local-terminal-unknown';
  }
}

async function onboard() {
  const currentTwid = getTwid();
  console.log(`[TWIP] Current Terminal ID: ${currentTwid}`);

  if (fs.existsSync(HEARTBEAT_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(HEARTBEAT_PATH, 'utf8'));
      const activePeers = (data.observed || []).filter(s => s.agentLike && s.agentId !== currentTwid);
      
      if (activePeers.length > 0) {
        console.log(`\n[TWIP] 🚦 Discovery Warning: Found ${activePeers.length} active agent terminals.`);
        activePeers.forEach(p => {
          console.log(`- ${p.agentId} [${p.tty}] CWD: ${p.cwd} | Cmd: ${p.foregroundCommand}`);
        });
        console.log('\n[TWIP] 🛑 To prevent duplication, ensure you are not running "tnf boot" in an existing agent lane.');
      } else {
        console.log('[TWIP] ✅ No other active agent terminals detected. Safe to proceed.');
      }
    } catch (e) {
      console.warn('[TWIP] ⚠️ Heartbeat inspection failed, proceeding with caution.');
    }
  }

  // Original onboarding logic bridge
  console.log('\n[TWIP] Handing off to canonical onboard...\n');
  spawnSync('node', [path.join(__dirname, 'tnf-onboard.cjs'), ...process.argv.slice(2)], { stdio: 'inherit' });

  // Add Discovery Step
  console.log('\n[TWIP] Executing Swarm Discovery...\n');
  spawnSync('node', [path.join(__dirname, 'tnf-discover-active.cjs')], { stdio: 'inherit' });
}

onboard();
