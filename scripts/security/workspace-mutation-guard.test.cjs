/**
 * Classification tests for workspace-mutation-guard.
 * Focus: pack-refs / gc must not be mistaken for stash when refs/stash is
 * merely rewritten among many refs.
 *
 * Run: node --test scripts/security/workspace-mutation-guard.test.cjs
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyRefTransaction,
  isStashMutation,
  isSafeMaintenance,
} = require('./workspace-mutation-guard.cjs');

const OID_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const OID_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const OID_C = 'cccccccccccccccccccccccccccccccccccccccc';

describe('isStashMutation', () => {
  it('detects sole refs/stash updates as stash', () => {
    const stdin = `${OID_A} ${OID_B} refs/stash\n`;
    assert.equal(isStashMutation(stdin, ''), true);
    assert.equal(isStashMutation(stdin, 'stash'), true);
  });

  it('does not treat pack-refs multi-ref rewrite that includes stash as stash', () => {
    const stdin = [
      `${OID_A} ${OID_B} refs/heads/main`,
      `${OID_A} ${OID_B} refs/stash`,
      `${OID_A} ${OID_C} refs/tags/v1`,
      '',
    ].join('\n');
    assert.equal(isStashMutation(stdin, 'pack-refs'), false);
    assert.equal(isStashMutation(stdin, ''), false);
  });

  it('still treats action=stash as stash even in mixed stdin', () => {
    const stdin = `${OID_A} ${OID_B} refs/heads/main\n${OID_A} ${OID_B} refs/stash\n`;
    assert.equal(isStashMutation(stdin, 'stash'), true);
  });
});

describe('classifyRefTransaction', () => {
  it('allows pack-refs / gc maintenance even when stash ref is present', () => {
    const stdin = [
      `${OID_A} ${OID_B} refs/heads/main`,
      `${OID_A} ${OID_B} refs/stash`,
      '',
    ].join('\n');
    assert.deepEqual(classifyRefTransaction({ action: 'pack-refs', stdin }), {
      block: false,
      reason: 'safe-maintenance',
    });
    assert.deepEqual(classifyRefTransaction({ action: 'gc', stdin }), {
      block: false,
      reason: 'safe-maintenance',
    });
    assert.equal(isSafeMaintenance('pack-refs'), true);
  });

  it('blocks true stash mutations', () => {
    const stdin = `${OID_A} ${OID_B} refs/stash\n`;
    assert.deepEqual(classifyRefTransaction({ action: '', stdin }), {
      block: true,
      reason: 'stash-mutation',
    });
  });

  it('blocks dangerous HEAD-moving actions', () => {
    assert.deepEqual(classifyRefTransaction({ action: 'reset', stdin: '' }), {
      block: true,
      reason: 'dangerous-action',
    });
  });

  it('allows benign empty transactions', () => {
    assert.deepEqual(classifyRefTransaction({ action: '', stdin: '' }), {
      block: false,
      reason: 'benign',
    });
  });
});
