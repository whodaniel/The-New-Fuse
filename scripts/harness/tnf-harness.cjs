#!/usr/bin/env node
/**
 * Unified TNF harness runtime dispatcher (working surface for scripts).
 * Prefer: node scripts/harness/tnf-harness.cjs <cmd>
 * Also exposed via `tnf harness …` once CLI dist is rebuilt.
 */
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS = {
  completeness: 'scripts/harness/verify-harness-completeness.cjs',
  provision: 'scripts/harness/provision-injection-surfaces.cjs',
  memory: 'scripts/harness/memory-layer.cjs',
  berm: 'scripts/harness/permission-berm.cjs',
  trajectory: 'scripts/harness/trajectory.cjs',
  compaction: 'scripts/harness/compaction-record.cjs',
  sandbox: 'scripts/harness/materialize-sandbox-profile.cjs',
  sandboxRun: 'scripts/harness/sandbox-run.cjs',
  supplyChain: 'scripts/harness/mcp-supply-chain-attest.cjs',
  hostCompaction: 'scripts/harness/host-compaction-adapter.cjs',
  failover: 'scripts/harness/provider-failover.cjs',
};

function run(rel, args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, rel), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(r.status ?? 1);
}

function help() {
  console.log(`Usage: node scripts/harness/tnf-harness.cjs <command> [args]

Commands:
  completeness [--provision|--json]
  provision [--repair|--verify|--json]
  memory retain|recall|pin|status …
  berm evaluate --action-class <class> …
  trajectory start|append|end|list …
  compaction write|list …
  sandbox [--out path]                 (materialize profile only)
  sandbox-run [--materialize-only] [--] <cmd>…
  supply-chain [--json] [--write-lock] [--check-lock|--strict]
  failover [--host <name>] [--json]
  host-compaction record|import|list …
`);
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === '-h' || cmd === '--help') {
    help();
    return;
  }
  if (cmd === 'completeness') run(SCRIPTS.completeness, rest);
  if (cmd === 'provision') run(SCRIPTS.provision, rest.length ? rest : ['--verify']);
  if (cmd === 'memory') run(SCRIPTS.memory, rest);
  if (cmd === 'berm') run(SCRIPTS.berm, rest);
  if (cmd === 'trajectory') run(SCRIPTS.trajectory, rest);
  if (cmd === 'compaction') run(SCRIPTS.compaction, rest);
  if (cmd === 'sandbox') run(SCRIPTS.sandbox, rest);
  if (cmd === 'sandbox-run') run(SCRIPTS.sandboxRun, rest);
  if (cmd === 'supply-chain') run(SCRIPTS.supplyChain, rest);
  if (cmd === 'failover' || cmd === 'provider-failover') run(SCRIPTS.failover, rest);
  if (cmd === 'host-compaction') run(SCRIPTS.hostCompaction, rest);
  console.error(`unknown command: ${cmd}`);
  help();
  process.exit(1);
}

main();
