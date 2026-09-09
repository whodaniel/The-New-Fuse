import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assertNotEscalationHalted,
  clearEscalationHalt,
  readEscalationState,
  recordCommandOutcome,
} from './action-receipt.js';

test('two identical failures escalate to halt', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-receipt-'));
  fs.mkdirSync(path.join(root, 'docs/operations'), { recursive: true });

  recordCommandOutcome(root, {
    intent: 't',
    cmd: 'node',
    args: ['-e', 'process.exit(1)'],
    cwd: root,
    ok: false,
    durationMs: 1,
    error: 'node exited with code 1',
  });
  let state = readEscalationState(root);
  assert.equal(state.halted, false);
  assert.equal(state.consecutiveIdenticalFailures, 1);

  recordCommandOutcome(root, {
    intent: 't',
    cmd: 'node',
    args: ['-e', 'process.exit(1)'],
    cwd: root,
    ok: false,
    durationMs: 1,
    error: 'node exited with code 1',
  });
  state = readEscalationState(root);
  assert.equal(state.halted, true);
  assert.equal(state.consecutiveIdenticalFailures, 2);
  assert.throws(() => assertNotEscalationHalted(root));

  clearEscalationHalt(root);
  assert.doesNotThrow(() => assertNotEscalationHalted(root));
});

test('full-auto failures use their own breaker without poisoning or clearing global escalation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-cycle-receipt-'));
  try {
    const input = { intent: 'audit', cmd: 'node', args: ['audit.cjs'], cwd: root, ok: false, durationMs: 1, error: 'audit failed' };
    for (let i = 0; i < 6; i++) recordCommandOutcome(root, { ...input, escalationScope: 'full-auto' });
    assert.equal(readEscalationState(root).halted, false);
    recordCommandOutcome(root, input);
    recordCommandOutcome(root, input);
    const before = readEscalationState(root);
    assert.equal(before.halted, true);
    recordCommandOutcome(root, { ...input, ok: true, escalationScope: 'full-auto' });
    assert.deepEqual(readEscalationState(root), before);
    const receipts = fs.readFileSync(path.join(root, 'docs/operations/tnf-action-receipts.jsonl'), 'utf8').trim().split('\n');
    assert.equal(receipts.length, 9);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
