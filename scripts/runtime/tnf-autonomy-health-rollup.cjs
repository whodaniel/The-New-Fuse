#!/usr/bin/env node
/**
 * TNF autonomy health rollup — establish ≠ operate.
 * Emits healthy | degraded | critical with reason codes.
 *
 * Usage: node scripts/runtime/tnf-autonomy-health-rollup.cjs [--json]
 * Env: TNF_AUTONOMY_HEALTH_FAIL_CLOSED=0 disables non-zero exit on critical (default fail-closed).
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const TNF_HOME = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
const ROOT = process.env.TNF_REPO_ROOT || path.resolve(__dirname, '../..');
const jsonMode = process.argv.includes('--json');

function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function diskStats() {
  try {
    // Prefer Data volume on macOS; fall back to /
    let out = '';
    try {
      out = execFileSync('df', ['-k', '/System/Volumes/Data'], { encoding: 'utf8' });
    } catch {
      out = execFileSync('df', ['-k', '/'], { encoding: 'utf8' });
    }
    const lines = out.trim().split('\n');
    const parts = lines[lines.length - 1].split(/\s+/);
    // Filesystem 1024-blocks Used Available Capacity iused...
    const totalK = Number(parts[1]);
    const availK = Number(parts[3]);
    const capStr = parts[4] || '';
    const capacityPct = Number(String(capStr).replace('%', '')) || null;
    const freeMb = availK / 1024;
    return { freeMb, capacityPct, totalGb: totalK / 1024 / 1024 };
  } catch (e) {
    return { freeMb: null, capacityPct: null, error: String(e.message || e) };
  }
}

function bridgeAlive() {
  const ps = spawnSync('pgrep', ['-f', 'hermes-tnf-a2a-bridge'], { encoding: 'utf8' });
  const pids = (ps.stdout || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { processAlive: pids.length > 0, pids };
}

function tipAlign() {
  const handoff = readJson(path.join(ROOT, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'), {});
  let head = '';
  try {
    head = execFileSync('git', ['-C', ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    head = '';
  }
  const handoffSha = handoff.head_sha || handoff.headSha || '';
  return {
    head,
    handoffSha,
    aligned: Boolean(
      head &&
        handoffSha &&
        (head === handoffSha ||
          head.startsWith(handoffSha) ||
          handoffSha.startsWith(head.slice(0, 12)))
    ),
  };
}

function zombieSample() {
  // Best-effort: count offline thin-client lines if tnf list is too slow — use redis scan light touch
  try {
    const out = execFileSync('redis-cli', ['--scan', '--pattern', '*thin-client*'], {
      encoding: 'utf8',
      timeout: 5000,
    });
    const keys = out
      .trim()
      .split('\n')
      .filter(Boolean);
    return { thinClientKeyMentions: keys.length };
  } catch {
    return { thinClientKeyMentions: null };
  }
}

function main() {
  const reasons = [];
  let status = 'healthy';

  const core = readJson(path.join(TNF_HOME, 'core-fleet-latest.json'), {});
  const autopilot = readJson(
    path.join(TNF_HOME, 'subdirector-autopilot/state/subdirector-autopilot-latest.json'),
    {}
  );
  const disk = diskStats();
  const bridge = bridgeAlive();
  const tip = tipAlign();
  const zombies = zombieSample();

  const apStatus = String(autopilot.status || autopilot.summary?.state || '').toLowerCase();
  const localSub =
    autopilot.checkResult?.parsed?.checks?.localSubdirectorStatus ||
    autopilot.summary?.localSubdirectorStatus ||
    '';

  if (apStatus === 'critical' || String(localSub).toLowerCase() === 'critical') {
    status = 'critical';
    reasons.push('autopilot_or_subdirector_critical');
  } else if (apStatus === 'degraded') {
    if (status !== 'critical') status = 'degraded';
    reasons.push('autopilot_degraded');
  }

  if (disk.capacityPct != null && disk.capacityPct >= 95) {
    status = 'critical';
    reasons.push(`disk_capacity_${disk.capacityPct}pct`);
  } else if (disk.freeMb != null && disk.freeMb < 2048) {
    if (status !== 'critical') status = 'degraded';
    reasons.push(`disk_free_mb_${Math.round(disk.freeMb)}`);
  }

  if (!bridge.processAlive) {
    // Bridge optional for local OSS — degraded not critical unless env requires
    if (status === 'healthy') status = 'degraded';
    reasons.push('a2a_bridge_process_absent');
  }

  if (tip.head && tip.handoffSha && !tip.aligned) {
    if (status === 'healthy') status = 'degraded';
    reasons.push('handoff_tip_drift');
  }

  if (core && core.ok === false) {
    status = 'critical';
    reasons.push('core_fleet_not_ok');
  }

  if (zombies.thinClientKeyMentions != null && zombies.thinClientKeyMentions > 50) {
    if (status === 'healthy') status = 'degraded';
    reasons.push(`thin_client_key_flood_${zombies.thinClientKeyMentions}`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    status,
    reasons,
    evidence: {
      coreFleetOk: core?.ok ?? null,
      autopilotStatus: apStatus || null,
      localSubdirectorStatus: localSub || null,
      disk,
      bridge,
      tip,
      zombies,
    },
    note: 'Observe/fail-closed for inspect only — do not stop full-auto loops based on this rollup.',
  };

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    console.log(`[tnf-autonomy-health] status=${status}`);
    for (const r of reasons) console.log(`  - ${r}`);
  }

  const failClosed = !['0', 'false', 'no', 'off'].includes(
    String(process.env.TNF_AUTONOMY_HEALTH_FAIL_CLOSED || '1')
      .trim()
      .toLowerCase()
  );
  if (failClosed && status === 'critical') process.exit(2);
  if (failClosed && status === 'degraded') process.exit(1);
  process.exit(0);
}

main();
