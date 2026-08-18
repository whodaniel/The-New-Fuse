#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const HEARTBEAT_PATH = path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'state', 'terminal-heartbeat-latest.json');

function getTwid() {
  if (process.env.TNF_TWID) return process.env.TNF_TWID;
  try {
    const parent = spawnSync('ps', ['-p', process.ppid, '-o', 'tty='], { encoding: 'utf8' });
    let tty = String(parent.stdout || '').trim();
    if (!tty || tty === '??') {
      const self = spawnSync('ps', ['-p', process.pid, '-o', 'tty='], { encoding: 'utf8' });
      tty = String(self.stdout || '').trim();
    }
    const normalized = tty.replace(/^\/dev\//, '').replace(/[^a-zA-Z0-9_-]/g, '-');
    return normalized ? `tnf-local-terminal-${normalized}` : 'tnf-local-terminal-unknown';
  } catch {
    return 'tnf-local-terminal-unknown';
  }
}

function terminalPeerSnapshot(currentTwid) {
  if (!fs.existsSync(HEARTBEAT_PATH)) return;
  try {
    const data = JSON.parse(fs.readFileSync(HEARTBEAT_PATH, 'utf8'));
    const activePeers = (data.observed || []).filter((s) => s.agentLike && s.agentId !== currentTwid);
    if (!activePeers.length) {
      console.log('[TWIP] No other active agent terminals detected.');
      return;
    }
    console.log(`[TWIP] ${activePeers.length} other active agent terminal(s):`);
    activePeers.slice(0, 10).forEach((p) => console.log(`- ${p.agentId} [${p.tty}] ${p.cwd} | ${p.foregroundCommand}`));
    console.log('[TWIP] Treat these as potential capability providers; do not assume they own this task.');
  } catch {
    console.log('[TWIP] Terminal heartbeat unavailable; provider discovery remains task-scoped.');
  }
}

function run(label, command, args, options = {}) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    console.error(`${label} exited ${result.status}`);
    return false;
  }
  return true;
}

function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

function onboard() {
  const currentTwid = getTwid();
  console.log('TNF Onboard V2');
  console.log(`[TWIP] Terminal ID: ${currentTwid}`);

  // Turn Zero V2 is intentionally the first protocol output. It is compact and
  // non-blocking unless --write-ready is requested.
  const gateArgs = [];
  if (hasFlag('--write-ready')) gateArgs.push('--require-write-ready');
  const taskIndex = process.argv.indexOf('--task');
  if (taskIndex >= 0 && process.argv[taskIndex + 1]) gateArgs.push('--task', process.argv[taskIndex + 1]);

  if (!run('Turn Zero V2', process.execPath, [path.join(ROOT, 'scripts/protocols/turn-zero-v2-gate.cjs'), ...gateArgs])) {
    process.exit(1);
  }

  terminalPeerSnapshot(currentTwid);

  // Lightweight current provider discovery. Failure is advisory: Turn Zero
  // only requires staffing when the task actually needs delegation.
  run('Capability / Active Provider Discovery', process.execPath, [path.join(ROOT, 'scripts/tnf-discover-active.cjs')]);

  // The large pre-V2 onboarder is retained as an explicit compatibility and
  // deep-diagnostics surface. Do not make every interactive turn pay its cost.
  if (hasFlag('--legacy-full') || process.env.TNF_ONBOARD_LEGACY_FULL === '1') {
    const legacyArgs = process.argv.slice(2).filter((x) => !['--legacy-full', '--write-ready'].includes(x));
    run('Legacy Full Onboard Diagnostics', process.execPath, [path.join(ROOT, 'scripts/tnf-onboard.cjs'), ...legacyArgs]);
  } else {
    console.log('\n- deep legacy diagnostics deferred (use --legacy-full when needed)');
  }

  console.log('\nTNF onboard complete.');
  console.log('- lifecycle: RESPOND -> ORIENT -> CLASSIFY -> HYDRATE -> STAFF -> ACT -> VERIFY -> PROPAGATE -> HANDOFF');
  console.log('- before mutation: rerun with --write-ready and provide classification env when not already known');
}

onboard();
