#!/usr/bin/env node
/**
 * Verify UNU-aligned TNF harness completeness against harness-config.json
 * plus runnable artefacts (injection, memory, berm, trajectories scaffolding).
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const CONFIG = path.join(ROOT, 'data/harness/harness-config.json');
const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir();

function parseArgs(argv) {
  return { json: argv.includes('--json'), provision: argv.includes('--provision') };
}

function expandHome(p) {
  const s = String(p);
  if (s === '~') return HOME;
  if (s.startsWith('~/') || s.startsWith('~\\')) return path.join(HOME, s.slice(2));
  return s;
}

function exists(rel) {
  const expanded = expandHome(rel);
  // Absolute $HOME-relative or already-absolute evidence paths are checked as-is.
  if (path.isAbsolute(expanded)) return fs.existsSync(expanded);
  return fs.existsSync(path.join(ROOT, rel));
}

function runNode(relScript, args = []) {
  const r = spawnSync(process.execPath, [path.join(ROOT, relScript), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return { code: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const checks = [];

  if (!exists('data/harness/harness-config.json')) {
    console.error('missing data/harness/harness-config.json');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));

  checks.push({
    name: 'config.present',
    ok: true,
    detail: `version=${config.version}`,
  });

  for (const [layer, meta] of Object.entries(config.layers || {})) {
    const evidence = Array.isArray(meta.evidence) ? meta.evidence : [];
    const missingEvidence = evidence.filter((e) => {
      const s = String(e);
      // CLI / free-text evidence, not filesystem paths
      if (/^tnf\s/.test(s) || s.includes('|') || /\bD\d+\b/.test(s)) return false;
      if (!s.includes('/') && !s.endsWith('.md') && !s.endsWith('.json') && !s.endsWith('.cjs') && !s.endsWith('.ts')) {
        return false;
      }
      const cleaned = s.replace(/\/$/, '').split(/\s+/)[0];
      if (!cleaned.includes('/') && cleaned.endsWith('.md')) {
        return !exists(cleaned) && !exists(`docs/protocols/${cleaned}`);
      }
      return !exists(cleaned);
    });
    const statusOk = ['implemented', 'partial'].includes(meta.status);
    checks.push({
      name: `layer.${layer}`,
      ok: statusOk && missingEvidence.length === 0,
      detail: `${meta.status}${missingEvidence.length ? ` missing=${missingEvidence.join(',')}` : ''}${
        meta.gap ? ` gap=${meta.gap}` : ''
      }`,
    });
  }

  const requiredFiles = [
    'docs/protocols/HARNESS_CONFIG.md',
    'docs/protocols/HARNESS_MEMORY_LAYER.md',
    'docs/protocols/HARNESS_TRAJECTORY.md',
    'docs/protocols/HARNESS_PERMISSION_BERM.md',
    'data/harness/permission-policy.json',
    'scripts/harness/memory-layer.cjs',
    'scripts/harness/trajectory.cjs',
    'scripts/harness/compaction-record.cjs',
    'scripts/harness/permission-berm.cjs',
    'scripts/harness/materialize-sandbox-profile.cjs',
    'scripts/harness/provision-injection-surfaces.cjs',
    'scripts/harness/host-prompt-profiles.cjs',
    'scripts/harness/mcp-runtime-provision.cjs',
    'scripts/harness/mcp-runtime-live-probe.cjs',
    'scripts/skills/universal-skill-disclosure-guard.cjs',
    'data/harness/managed-mcp-runtime.json',
    'schemas/managed-mcp-runtime.schema.json',
    'data/harness/host-prompt-profiles.json',
    'scripts/forge_sandbox.sb',
  ];
  for (const rel of requiredFiles) {
    checks.push({ name: `file.${rel}`, ok: exists(rel), detail: exists(rel) ? 'present' : 'missing' });
  }

  if (opts.provision) {
    const prov = runNode('scripts/harness/provision-injection-surfaces.cjs', ['--repair', '--json']);
    checks.push({
      name: 'injection.provision',
      ok: prov.code === 0,
      detail: prov.code === 0 ? 'repaired/verified' : prov.stderr.trim() || 'provision failed',
    });
  } else {
    const prov = runNode('scripts/harness/provision-injection-surfaces.cjs', ['--verify', '--json']);
    checks.push({
      name: 'injection.verify',
      ok: prov.code === 0,
      detail: prov.code === 0 ? 'surfaces ok' : 'run with --provision or provision-injection-surfaces --repair',
    });
  }

  const berm = runNode('scripts/harness/permission-berm.cjs', [
    'evaluate',
    '--action-class',
    'read',
    '--json',
  ]);
  let bermOk = berm.code === 0;
  try {
    const parsed = JSON.parse(berm.stdout);
    bermOk = bermOk && parsed.ok === true && parsed.decision === 'allow';
  } catch {
    bermOk = false;
  }
  checks.push({ name: 'berm.evaluate_read', ok: bermOk, detail: bermOk ? 'allow' : 'berm failed' });

  const deny = runNode('scripts/harness/permission-berm.cjs', [
    'evaluate',
    '--action-class',
    'financial',
    '--json',
  ]);
  checks.push({
    name: 'berm.deny_financial',
    ok: deny.code === 2,
    detail: deny.code === 2 ? 'deny exit=2' : `expected exit 2 got ${deny.code}`,
  });

  const mem = runNode('scripts/harness/memory-layer.cjs', ['status', '--json']);
  checks.push({
    name: 'memory.layer_status',
    ok: mem.code === 0,
    detail: mem.code === 0 ? 'ok' : mem.stderr.trim() || 'failed',
  });

  const supply = runNode('scripts/harness/mcp-supply-chain-attest.cjs', ['--json']);
  let supplyOk = supply.code === 0;
  try {
    const parsed = JSON.parse(supply.stdout || '{}');
    supplyOk = supply.code === 0 && parsed.ok === true;
  } catch {
    supplyOk = false;
  }
  checks.push({
    name: 'supply_chain.inventory',
    ok: supplyOk,
    detail: supplyOk ? 'soft inventory ok' : 'supply-chain attest failed',
  });

  const hostCmpOk =
    exists('scripts/harness/host-compaction-adapter.cjs') &&
    exists('scripts/harness/compaction-record.cjs') &&
    exists('docs/protocols/HARNESS_HOST_COMPACTION.md');
  let hostCmpDetail = hostCmpOk
    ? 'adapter+protocol present (record|import|status|verify)'
    : 'host-compaction adapter or protocol missing';
  if (hostCmpOk) {
    const verify = runNode('scripts/harness/host-compaction-adapter.cjs', ['verify']);
    let verifyOk = verify.code === 0;
    try {
      const parsed = JSON.parse(verify.stdout || '{}');
      verifyOk = verify.code === 0 && parsed.ok === true;
      hostCmpDetail += `; verify checked=${parsed.checked ?? '?'}`;
    } catch {
      verifyOk = false;
    }
    checks.push({
      name: 'host_compaction.verify',
      ok: verifyOk,
      detail: verifyOk ? hostCmpDetail : 'host-compaction verify failed',
    });
  }
  checks.push({
    name: 'host_compaction.adapter',
    ok: hostCmpOk,
    detail: hostCmpDetail,
  });

  for (const rel of [
    'scripts/harness/tnf-harness.cjs',
    'scripts/harness/mcp-supply-chain-attest.cjs',
    'scripts/harness/host-compaction-adapter.cjs',
    'scripts/harness/memory-mcp-server.cjs',
    'data/harness/mcp.memory.server.json',
  ]) {
    checks.push({ name: `file.${rel}`, ok: exists(rel), detail: exists(rel) ? 'present' : 'missing' });
  }

  const failed = checks.filter((c) => !c.ok);
  const ok = failed.length === 0;
  const out = { ok, failed: failed.length, checks };

  if (opts.json) console.log(JSON.stringify(out, null, 2));
  else {
    console.log('TNF harness completeness');
    for (const c of checks) console.log(`${c.ok ? 'OK' : 'FAIL'}: ${c.name} — ${c.detail}`);
    console.log(ok ? '\nHARNESS COMPLETENESS PASS' : `\n${failed.length} check(s) failed`);
  }
  process.exit(ok ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.error(`verify-harness-completeness: ${err.message}`);
  process.exit(1);
}
