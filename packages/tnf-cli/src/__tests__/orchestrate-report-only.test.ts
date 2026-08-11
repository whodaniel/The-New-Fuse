#!/usr/bin/env node
/**
 * A2 fixture — REPORT_ONLY orchestrate classifier must not schedule mutate tasks.
 * Run: pnpm exec tsx src/__tests__/orchestrate-report-only.test.ts
 */
import assert from 'node:assert/strict';
import {
  GoalPlanner,
  classifyOrchestrateIntent,
  extractReportOutputPath,
} from '../orchestration.js';

async function main() {
  const auditGoal =
    'REPORT-ONLY audit: write docs/operations/audits/amendments/_orchestrate_smoke.md with one line ping';
  const cls = classifyOrchestrateIntent(auditGoal);
  assert.equal(cls.intent, 'REPORT_ONLY');
  assert.equal(
    extractReportOutputPath(auditGoal),
    'docs/operations/audits/amendments/_orchestrate_smoke.md'
  );

  const planner = new GoalPlanner();
  const wf = await planner.plan(auditGoal);
  assert.equal(wf.metadata.orchestrateIntent, 'REPORT_ONLY');
  assert.ok(
    !wf.tasks.some((t) => t.name === 'execute-safe-refactors'),
    'audit goals must not schedule execute-safe-refactors'
  );
  assert.ok(
    wf.metadata.planningStrategy === 'pattern:tnf-report-only' ||
      wf.tasks.some((t) => t.name === 'write-report-artifact'),
    'expected report-only planning strategy'
  );

  const mutateOverride = classifyOrchestrateIntent(
    'audit and implement the fix now for execute-safe-refactors'
  );
  assert.equal(mutateOverride.intent, 'MUTATE_ALLOWED');

  console.log('orchestrate-report-only.test.ts: PASS');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
