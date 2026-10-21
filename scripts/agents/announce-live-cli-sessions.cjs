#!/usr/bin/env node
'use strict';

/**
 * Announce every live interactive CLI coding session for Subdirector dispatch.
 *
 * Discovers co-resident agent ttys via scripts/system/tnf-agent-who-is-who.py,
 * then calls announce-availability.cjs once per dispatchable peer session.
 *
 * Law: docs/protocols/AGENT_AVAILABILITY_ANNOUNCE.md
 *
 * Usage:
 *   node scripts/agents/announce-live-cli-sessions.cjs
 *   node scripts/agents/announce-live-cli-sessions.cjs --json
 *   node scripts/agents/announce-live-cli-sessions.cjs --offline
 *   tnf agents announce --live
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const WHO_SCRIPT = path.join(ROOT, 'scripts/system/tnf-agent-who-is-who.py');
const ANNOUNCE_SCRIPT = path.join(ROOT, 'scripts/agents/announce-availability.cjs');

/** who-is-who id → TNF platform taxonomy token */
const PLATFORM_BY_ID = {
  'cursor-agent': 'cursor',
  claude: 'claude',
  codex: 'codex',
  hermes: 'hermes',
  gemini: 'gemini',
  pi: 'pi',
  kilo: 'kilo',
  opencode: 'opencode',
  openclaw: 'openclaw',
  aider: 'aider',
  'tnf-cli': 'tnf',
};

/** Skip control-plane TNF windows; peer CLIs on the same tty are announced. */
const SKIP_TNF_DETAILS = new Set(['TUI', 'boot']);

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function argValue(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function loadLiveSessions() {
  const res = spawnSync('python3', [WHO_SCRIPT, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    throw new Error(
      `who-is-who failed: ${(res.stderr || res.stdout || '').trim() || `exit ${res.status}`}`
    );
  }
  const payload = JSON.parse(String(res.stdout || '{}'));
  const live = Array.isArray(payload.live) ? payload.live : [];
  return live;
}

function shouldAnnounce(session) {
  const id = String(session.id || '');
  if (!PLATFORM_BY_ID[id]) return false;
  if (id === 'tnf-cli') {
    const detail = String(session.detail || '');
    if (SKIP_TNF_DETAILS.has(detail)) return false;
    // Passthrough wrappers (`tnf hermes`, `tnf claude`) are not workers.
    const cmd = String(session.command || '');
    if (/\b(hermes|claude|codex|cursor|gemini|pi|kilo|opencode|openclaw)\b/.test(cmd)) {
      return false;
    }
  }
  if (!session.tty || session.tty === '??' || session.tty === '-') return false;
  return true;
}

function announceOne(session, { offline, cadenceSec, to, capabilities }) {
  const platform = PLATFORM_BY_ID[session.id];
  const name =
    platform === 'tnf'
      ? 'tnf-session-worker'
      : `tnf-${platform}-worker`;
  const args = [
    ANNOUNCE_SCRIPT,
    '--json',
    '--platform',
    platform,
    '--name',
    name,
    '--tty',
    String(session.tty),
    '--role',
    'worker',
  ];
  if (to) args.push('--to', to);
  if (cadenceSec) args.push('--cadence-sec', String(cadenceSec));
  if (capabilities) args.push('--capabilities', capabilities);
  if (offline) args.push('--offline');

  const res = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  const stdout = String(res.stdout || '').trim();
  let receipt = null;
  try {
    receipt = stdout ? JSON.parse(stdout) : null;
  } catch {
    receipt = { ok: false, raw: stdout.slice(0, 400) };
  }
  if (res.status !== 0) {
    return {
      ok: false,
      platform,
      tty: session.tty,
      pid: session.pid,
      error: (res.stderr || stdout || `exit ${res.status}`).trim().slice(0, 400),
      receipt,
    };
  }
  return {
    ok: true,
    platform,
    tty: session.tty,
    pid: session.pid,
    name: session.name,
    agentId: receipt?.agentId,
    dispatchable: receipt?.dispatchable,
    status: receipt?.status,
    receiptPath: receipt?.receiptPath,
  };
}

function main() {
  const offline = hasFlag('--offline');
  const jsonOut = hasFlag('--json');
  const cadenceSec = argValue('--cadence-sec', '900');
  const to = argValue('--to', 'tnf-cli-agent');
  const capabilities = argValue(
    '--capabilities',
    'code_edit,frontend,protocol,personal_intelligence,cli,review'
  );

  const live = loadLiveSessions();
  const targets = live.filter(shouldAnnounce);
  const results = targets.map((session) =>
    announceOne(session, { offline, cadenceSec, to, capabilities })
  );

  const summary = {
    ok: results.every((r) => r.ok),
    protocol: 'TNF_AGENT_AVAILABILITY_ANNOUNCE',
    mode: offline ? 'offline' : 'available',
    discovered: live.length,
    announced: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    skipped: live.length - targets.length,
    results,
    at: new Date().toISOString(),
  };

  if (jsonOut) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`=== Live CLI Availability Announce (${summary.mode}) ===`);
    console.log(
      `- discovered ${summary.discovered} live tty agent(s); announced ${summary.announced}; skipped ${summary.skipped}; failed ${summary.failed}`
    );
    for (const r of results) {
      if (r.ok) {
        console.log(
          `  ✓ ${r.name || r.platform} @ ${r.tty} → ${r.agentId} (dispatchable=${r.dispatchable})`
        );
      } else {
        console.log(`  ✗ ${r.platform} @ ${r.tty}: ${r.error}`);
      }
    }
  }

  if (!summary.ok) process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(`[announce-live-cli-sessions] FAIL: ${err.message || err}`);
  process.exit(1);
}
