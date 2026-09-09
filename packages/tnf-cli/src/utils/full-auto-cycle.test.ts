import assert from 'node:assert/strict';
import {
  classifyStrictStatusGate,
  QualityGateError,
  countTrailingFailures,
  DEFAULT_FULL_AUTO_POST_STEP_TIMEOUT_MS,
  FULL_AUTO_FAIL_STREAK,
  resolvePostStepTimeoutMs,
  tallyFullAutoRuns,
} from './full-auto-cycle.js';

function check(label: string, condition: boolean): void {
  assert.equal(condition, true, label);
}

{
  const capped = resolvePostStepTimeoutMs(60 * 60 * 1000);
  check('post-step capped at default ceiling', capped === DEFAULT_FULL_AUTO_POST_STEP_TIMEOUT_MS);

  const short = resolvePostStepTimeoutMs(30_000);
  check('post-step uses remaining when below ceiling', short === 30_000);

  const floor = resolvePostStepTimeoutMs(0);
  check('post-step never returns zero', floor === 1);
}

{
  const tallied = tallyFullAutoRuns([
    { ok: true },
    { ok: false },
    { ok: true },
    { ok: false },
    { ok: true },
  ]);
  check('tallies completed', tallied.completedCycles === 3);
  check('tallies failed', tallied.failedCycles === 2);
}

{
  // The circuit breaker this repo lacked: a 212-cycle unbroken failure streak
  // ran for five weeks because the gate consulted a lifetime counter plus a
  // `lastRun.ok` escape hatch instead of the trailing streak.
  check('empty log has no streak', countTrailingFailures([]) === 0);
  check(
    'a passing tail clears the streak',
    countTrailingFailures([{ ok: false }, { ok: false }, { ok: true }]) === 0
  );
  check(
    'counts only the trailing run',
    countTrailingFailures([{ ok: false }, { ok: true }, { ok: false }, { ok: false }]) === 2
  );
  check(
    'all-failed counts every event',
    countTrailingFailures([{ ok: false }, { ok: false }, { ok: false }]) === 3
  );

  const streaking = Array.from({ length: FULL_AUTO_FAIL_STREAK }, () => ({ ok: false }));
  check(
    'threshold trips at the constant',
    countTrailingFailures(streaking) >= FULL_AUTO_FAIL_STREAK
  );

  // Lifetime failures with a healthy tail must NOT trip: this is the case the
  // old gate got wrong in the permanently-latched direction.
  const historyThenRecovery = [
    ...Array.from({ length: 200 }, () => ({ ok: false })),
    { ok: true },
    { ok: true },
  ];
  check(
    'recovered loop is not quarantined on history alone',
    countTrailingFailures(historyThenRecovery) === 0
  );
}

for (const [exitCode, stdout, verdict] of [
  [0, '{"ok":true}', 'passed'],
  [1, '{"ok":false,"missingRequired":["scorecard"]}', 'failed'],
  [0, '{"ok":false}', 'failed'],
  [1, '{"ok":true}', 'unverified'],
  [1, 'crashed', 'unverified'],
  [0, '{}', 'unverified'],
  [0, '{"ok":"true"}', 'unverified'],
  [null, '{"ok":true}', 'unverified'],
] as const) {
  assert.equal(classifyStrictStatusGate({exitCode, stdout}).verdict, verdict);
}
assert.equal(classifyStrictStatusGate({exitCode: 0, stdout: '{"ok":true}', timedOut: true}).verdict, 'unverified');
assert.equal(classifyStrictStatusGate({exitCode: null, stdout: '', spawnError: 'ENOENT'}).verdict, 'unverified');
const gateError = new QualityGateError('failed', 'missing scorecard');
assert.equal(gateError.verdict, 'failed');
assert.equal(gateError.reason, 'missing scorecard');
console.log('full-auto-cycle.test.ts: ok');

// Recovery retains quarantine on failure or an opted-out quality gate.
const { resolveFullAutoCompletion } = await import('./full-auto-cycle.js');
const quarantine = { mode: 'quarantined', quarantinedAt: '2026-01-01T00:00:00Z', quarantineReason: 'five failures' };
const priorEvents = [{ ok: true }, { ok: false }, { ok: false }];
const finishedAt = new Date().toISOString();
assert.equal(resolveFullAutoCompletion(quarantine, priorEvents, { ok: false, finishedAt }).mode, 'quarantined');
assert.equal(resolveFullAutoCompletion(quarantine, priorEvents, { ok: true, qualityGate: 'skipped', finishedAt }).mode, 'quarantined');
const recovered = resolveFullAutoCompletion(quarantine, priorEvents, { ok: true, qualityGate: 'passed', finishedAt });
assert.equal(recovered.mode, 'idle');
assert.equal(recovered.completedCycles, 2);
assert.equal(recovered.failedCycles, 2);
assert.equal(recovered.recoveredAt, finishedAt);
assert.equal(recovered.quarantineReason, undefined);
assert.equal(resolveFullAutoCompletion({}, Array.from({ length: 4 }, () => ({ ok: false })), { ok: false, finishedAt }).mode, 'quarantined');
console.log('full-auto recovery state tests passed');

assert.equal(resolveFullAutoCompletion({ ...quarantine, failedCycles: 230 }, priorEvents, { ok: true, qualityGate: 'passed', finishedAt }).failedCycles, 230);
