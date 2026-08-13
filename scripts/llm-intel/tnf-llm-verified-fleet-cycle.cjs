#!/usr/bin/env node
/**
 * TNF LLM Verified Fleet Cycle — restored catalog entrypoint.
 * Chains existing llm-intel collectors/optimizers without inventing mock winners.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'reports/protocols/llm-verified-fleet');
const OUT_JSON = path.join(OUT_DIR, 'tnf-llm-verified-fleet-cycle-latest.json');

function runStep(label, relScript, extraEnv = {}) {
  const abs = path.join(ROOT, relScript);
  if (!fs.existsSync(abs)) {
    return { label, ok: false, missing: true, script: relScript };
  }
  const result = spawnSync(process.execPath, [abs], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
    timeout: Number(process.env.TNF_LLM_FLEET_STEP_TIMEOUT_MS || 240000),
  });
  return {
    label,
    ok: result.status === 0,
    status: result.status,
    script: relScript,
    stdoutPreview: String(result.stdout || '').slice(0, 400),
    stderrPreview: String(result.stderr || '').slice(0, 400),
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const apply = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.TNF_LLM_VERIFY_APPLY || '0')
      .trim()
      .toLowerCase()
  );

  const steps = [
    runStep('arena-intel', 'scripts/llm-intel/llm-arena-intel-collector.cjs'),
    runStep('ranking-optimizer', 'scripts/llm-intel/llm-ranking-optimizer.cjs'),
  ];

  if (apply) {
    steps.push(
      runStep('apply-rankings', 'scripts/llm-intel/llm-apply-rankings.cjs', {
        TNF_LLM_VERIFY_APPLY: '1',
      })
    );
  }

  const ok = steps.every((s) => (s.missing ? false : s.ok));
  // Missing optional apply step shouldn't fail the cycle; missing core collectors do.
  const coreOk = steps
    .filter((s) => s.label !== 'apply-rankings')
    .every((s) => s.ok);

  const payload = {
    ok: coreOk,
    processId: 'tnf-llm-verified-fleet-cycle',
    startedAt,
    finishedAt: new Date().toISOString(),
    apply,
    steps,
    note: 'Verified fleet cycle restored entrypoint — live collectors only; no hardcoded preference authority.',
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify({ ok: payload.ok, jsonPath: path.relative(ROOT, OUT_JSON) }));
  process.exit(payload.ok ? 0 : 1);
}

main();
