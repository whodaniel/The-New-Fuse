#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = process.cwd();
const HEARTBEAT_PATH = path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'state', 'terminal-heartbeat-latest.json');

function hasFlag(name) { return process.argv.slice(2).includes(name); }
function valueAfter(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}
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
function run(label, command, args, { advisory = false, capture = false } = {}) {
  if (!capture) console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: process.env,
  });
  const ok = result.status === 0;
  if (!ok && !capture) console.error(`${label} exited ${result.status}`);
  return { ok, code: result.status ?? 1, stdout: result.stdout || '', stderr: result.stderr || '', advisory };
}
function terminalPeerSnapshot(currentTwid) {
  if (!fs.existsSync(HEARTBEAT_PATH)) return { available: false, peers: [] };
  try {
    const data = JSON.parse(fs.readFileSync(HEARTBEAT_PATH, 'utf8'));
    const peers = (data.observed || []).filter((s) => s.agentLike && s.agentId !== currentTwid).slice(0, 10);
    if (!peers.length) console.log('[TWIP] No other active agent terminals detected.');
    else {
      console.log(`[TWIP] ${peers.length} other active agent terminal(s):`);
      peers.forEach((p) => console.log(`- ${p.agentId} [${p.tty}] ${p.cwd} | ${p.foregroundCommand}`));
      console.log('[TWIP] These are capability candidates and collision signals, not automatic task owners.');
    }
    return { available: true, peers };
  } catch {
    console.log('[TWIP] Terminal heartbeat unreadable; provider/workstream discovery remains task-scoped.');
    return { available: false, peers: [] };
  }
}
function main() {
  const currentTwid = getTwid();
  const task = valueAfter('--task') || process.env.TNF_TASK || '';
  const writeReady = hasFlag('--write-ready');
  const jsonMode = hasFlag('--json');
  const results = [];

  if (!jsonMode) {
    console.log('TNF Onboard — Turn Zero V2 (current Turn Zero)');
    console.log('Manifest-derived Stage A harness; gate: scripts/protocols/turn-zero-v2-gate.cjs');
    console.log(`[TWIP] Terminal ID: ${currentTwid}`);
  }

  const gateArgs = ['--write-receipt', '--consumer', currentTwid];
  if (writeReady) gateArgs.push('--require-write-ready');
  if (task) gateArgs.push('--task', task);
  if (jsonMode) gateArgs.push('--json');
  const gate = run('Turn Zero V2 / Stage A Hydration', process.execPath, [path.join(ROOT, 'scripts/protocols/turn-zero-v2-gate.cjs'), ...gateArgs], { capture: jsonMode });
  results.push({ id: 'turn-zero', ...gate });
  if (!gate.ok) {
    if (jsonMode) console.log(JSON.stringify({ ok: false, currentTwid, task, results }, null, 2));
    process.exit(1);
  }

  const frontload = run('Repo Frontload Contract', process.execPath, [path.join(ROOT, 'scripts/verify-repo-frontload.cjs'), ...(jsonMode ? ['--json'] : [])], { capture: jsonMode });
  results.push({ id: 'repo-frontload', ...frontload });
  if (!frontload.ok) {
    if (jsonMode) console.log(JSON.stringify({ ok: false, currentTwid, task, results }, null, 2));
    process.exit(1);
  }

  const routes = run('Onboarding Route Integrity', process.execPath, [path.join(ROOT, 'scripts/harness/verify-onboarding-routes.cjs'), ...(jsonMode ? ['--json'] : [])], { capture: jsonMode });
  results.push({ id: 'onboarding-routes', ...routes });
  if (!routes.ok) {
    if (jsonMode) console.log(JSON.stringify({ ok: false, currentTwid, task, results }, null, 2));
    process.exit(1);
  }

  const injection = run('Harness Injection Surfaces', process.execPath, [path.join(ROOT, 'scripts/harness/provision-injection-surfaces.cjs'), '--verify', ...(jsonMode ? ['--json'] : [])], { advisory: !writeReady, capture: jsonMode });
  results.push({ id: 'injection-surfaces', ...injection });
  if (writeReady && !injection.ok) {
    if (jsonMode) console.log(JSON.stringify({ ok: false, currentTwid, task, results }, null, 2));
    process.exit(1);
  }

  if (!jsonMode) terminalPeerSnapshot(currentTwid);

  const discovery = run('Capability / Active Provider Discovery', process.execPath, [path.join(ROOT, 'scripts/tnf-discover-active.cjs')], { advisory: true, capture: jsonMode });
  results.push({ id: 'provider-discovery', ...discovery });

  if (hasFlag('--full-harness')) {
    const complete = run('Full Harness Completeness', process.execPath, [path.join(ROOT, 'scripts/harness/verify-harness-completeness.cjs'), ...(jsonMode ? ['--json'] : [])], { capture: jsonMode });
    results.push({ id: 'harness-completeness', ...complete });
    if (!complete.ok) {
      if (jsonMode) console.log(JSON.stringify({ ok: false, currentTwid, task, results }, null, 2));
      process.exit(1);
    }
  }

  if (hasFlag('--legacy-full') || process.env.TNF_ONBOARD_LEGACY_FULL === '1') {
    const legacyArgs = process.argv.slice(2).filter((x) => !['--legacy-full', '--write-ready', '--full-harness', '--json'].includes(x));
    const legacy = run('Legacy Full Onboard Diagnostics (non-authoritative)', process.execPath, [path.join(ROOT, 'scripts/tnf-onboard.cjs'), ...legacyArgs], { advisory: true, capture: jsonMode });
    results.push({ id: 'legacy-diagnostics', ...legacy });
  } else if (!jsonMode) {
    console.log('\n- legacy diagnostic checklist deferred; FRONTLOAD_MANIFEST.md is the only Stage A inventory authority');
  }

  const ok = results.every((row) => row.ok || row.advisory);
  if (jsonMode) {
    console.log(JSON.stringify({
      ok,
      currentTwid,
      task,
      writeReadyRequested: writeReady,
      lifecycle: ['RESPOND','ORIENT','CLASSIFY','HYDRATE','STAFF','ACT','VERIFY','PROPAGATE','HANDOFF'],
      receipt: '.agent/runtime-logs/turn-zero-stage-a.latest.json',
      results: results.map(({ stdout, stderr, ...row }) => ({ ...row, stdout: stdout.trim(), stderr: stderr.trim() })),
    }, null, 2));
  } else {
    console.log('\nTNF onboarding complete — Turn Zero V2.');
    console.log('- "Turn Zero" means Turn Zero V2; there is no separate current Turn Zero.');
    console.log('- Stage A was derived from FRONTLOAD_MANIFEST.md and hash-receipted.');
    console.log('- Stage B/C remain task-scoped; required onboarding routes were verified to resolve.');
    console.log('- active peers are collision/capability signals; verify ownership before overlapping edits.');
    console.log('- after compaction, provider substitution, repo movement, or authority-hash change: rerun pnpm run tnf:onboard.');
    if (!injection.ok && !writeReady) console.log('- WARNING: one or more host injection surfaces are incomplete; run harness provisioning before autonomous/write-ready work.');
  }
  process.exit(ok ? 0 : 1);
}

main();
