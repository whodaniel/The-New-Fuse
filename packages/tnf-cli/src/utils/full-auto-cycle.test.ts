import assert from 'node:assert/strict';
import {
  resolvePostStepTimeoutMs,
  tallyFullAutoRuns,
  DEFAULT_FULL_AUTO_POST_STEP_TIMEOUT_MS,
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

console.log('full-auto-cycle.test.ts: ok');
