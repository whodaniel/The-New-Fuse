#!/usr/bin/env node
/**
 * TNF Open Runtime — verified model observation/policy cycle.
 *
 * Public behavior:
 *   collector -> observation/operator-policy rank -> optional explicit operator plan apply.
 *
 * No TNF-hosted preference weights or automatic provider authority are embedded.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'reports/protocols/llm-verified-fleet');
const OUT_JSON = path.join(OUT_DIR, 'tnf-llm-verified-fleet-cycle-latest.json');

function runStep(label, relScript, args = [], extraEnv = {}) {
  const abs = path.join(ROOT, relScript);
  if (!fs.existsSync(abs)) {
    return { label, ok: false, missing: true, script: relScript };
  }
  const result = spawnSync(process.execPath, [abs, ...args], {
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
    args,
    stdoutPreview: String(result.stdout || '').slice(0, 600),
    stderrPreview: String(result.stderr || '').slice(0, 600),
  };
}

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const applyRequested = truthy(process.env.TNF_LLM_VERIFY_APPLY);
  const plan = process.env.TNF_LOCAL_LLM_POLICY_PLAN
    ? path.resolve(process.env.TNF_LOCAL_LLM_POLICY_PLAN)
    : null;

  const steps = [
    runStep('arena-intel', 'scripts/llm-intel/llm-arena-intel-collector.cjs'),
    runStep('observations-and-local-policy', 'scripts/llm-intel/llm-ranking-optimizer.cjs'),
  ];

  if (applyRequested) {
    if (!plan) {
      steps.push({
        label: 'apply-operator-plan',
        ok: false,
        status: null,
        script: 'scripts/llm-intel/llm-apply-rankings.cjs',
        reason: 'TNF_LLM_VERIFY_APPLY requested but TNF_LOCAL_LLM_POLICY_PLAN is not set',
      });
    } else {
      steps.push(
        runStep(
          'apply-operator-plan',
          'scripts/llm-intel/llm-apply-rankings.cjs',
          ['--plan', plan, '--apply']
        )
      );
    }
  }

  const coreOk = steps
    .filter((step) => step.label !== 'apply-operator-plan')
    .every((step) => step.ok);
  const applyOk = !applyRequested || steps.find((step) => step.label === 'apply-operator-plan')?.ok === true;

  const payload = {
    ok: coreOk && applyOk,
    processId: 'tnf-open-llm-verified-fleet-cycle',
    startedAt,
    finishedAt: new Date().toISOString(),
    applyRequested,
    operatorPlan: plan,
    steps,
    evidenceState: 'reported',
    note: 'Open runtime collects evidence and may apply an explicit operator-owned plan. TNF hosted ranking/optimization weights are not embedded.',
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify({ ok: payload.ok, jsonPath: path.relative(ROOT, OUT_JSON) }));
  process.exit(payload.ok ? 0 : 1);
}

main();
