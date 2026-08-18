#!/usr/bin/env node
/**
 * Golden smoke for the reliability harness.
 * Runs help, substrate warn, authority, autonomy level probe, and an adversarial
 * require-mode expectation (quarantine/hard-fail should exit 1 under require).
 */
/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function run(label, args, env = {}, expectStatus = 0) {
  const result = spawnSync(process.execPath, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, TNF_SKIP_TURN_ZERO_ONBOARD: '1', TNF_SKIP_PREFLIGHT: '1', ...env },
    timeout: 60_000,
  });
  const status = result.status ?? 1;
  const ok = status === expectStatus;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label} (exit=${status} expected=${expectStatus})`);
  if (!ok) {
    console.log((result.stderr || result.stdout || '').slice(0, 500));
  }
  return ok;
}

function main() {
  const steps = [];
  steps.push(
    run('substrate-warn', [
      path.join('scripts/protocols/validate-substrate-attestation.cjs'),
      '--mode=warn',
    ])
  );
  steps.push(
    run('turn-zero-authority', [
      path.join('scripts/protocols/validate-turn-zero-authority.cjs'),
      '--mode=ci',
    ])
  );
  steps.push(
    run('progressive-autonomy-level0', [
      path.join('scripts/protocols/validate-progressive-autonomy.cjs'),
      '--level=0',
      '--json',
    ])
  );

  // Adversarial: require mode must fail while full-auto is quarantined / hard fails exist.
  const statePath = path.join(REPO_ROOT, 'docs/operations/tnf-full-auto-state.json');
  let quarantined = false;
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    quarantined = state.mode === 'quarantined';
  } catch {
    /* ignore */
  }
  if (quarantined) {
    steps.push(
      run(
        'adversarial-require-blocks-when-quarantined',
        [path.join('scripts/protocols/validate-substrate-attestation.cjs'), '--mode=require'],
        {},
        1
      )
    );
  } else {
    console.log('SKIP adversarial-require-blocks-when-quarantined (not quarantined)');
  }

  // CLI help via launcher if available
  const tnf = spawnSync('tnf', ['--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, TNF_SKIP_TURN_ZERO_ONBOARD: '1', TNF_SKIP_PREFLIGHT: '1' },
    timeout: 30_000,
  });
  const helpOk = (tnf.status ?? 1) === 0;
  console.log(`${helpOk ? 'PASS' : 'FAIL'} tnf-help (exit=${tnf.status})`);
  steps.push(helpOk);

  const passed = steps.filter(Boolean).length;
  const total = steps.length;
  console.log(`\nGolden smoke: ${passed}/${total} passed`);
  process.exit(passed === total ? 0 : 1);
}

main();
