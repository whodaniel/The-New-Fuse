/**
 * Stable agent identity regression tests.
 *
 * Origin: 2026-08-16. `RedisAgentClient.register()` minted
 * `agent_${name}_${Date.now()}`, so every process start enrolled a brand-new agent.
 * `~/.tnf/authority/keys/` held 41,306 keypairs and `pubkeys/` 20,654 against exactly
 * one role assignment. Operator-approved persistent access is impossible when the
 * subject of the approval never survives a restart.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveStableAgentId } from './RedisAgentClient.js';

function withEnv(key: string, value: string | undefined, fn: () => void) {
  const prior = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  try {
    fn();
  } finally {
    if (prior === undefined) delete process.env[key];
    else process.env[key] = prior;
  }
}

test('the same agent resolves to the same id across calls (survives restart)', () => {
  withEnv('TNF_AGENT_ID', undefined, () => {
    const first = resolveStableAgentId('BROKER-Green', 'claude');
    const second = resolveStableAgentId('BROKER-Green', 'claude');
    assert.equal(first, second);
  });
});

test('the id carries no timestamp', () => {
  withEnv('TNF_AGENT_ID', undefined, () => {
    const id = resolveStableAgentId('BROKER-Green', 'claude');
    // The old shape ended in a 13-digit epoch; a stable id must not.
    assert.doesNotMatch(id, /_\d{13}$/, `id still looks time-derived: ${id}`);
  });
});

test('different agents and platforms do not collide', () => {
  withEnv('TNF_AGENT_ID', undefined, () => {
    const a = resolveStableAgentId('BROKER-Green', 'claude');
    const b = resolveStableAgentId('BROKER-Blue', 'claude');
    const c = resolveStableAgentId('BROKER-Green', 'gemini');
    assert.notEqual(a, b, 'distinct names must not share an identity');
    assert.notEqual(a, c, 'distinct platforms must not share an identity');
  });
});

test('TNF_AGENT_ID overrides derivation', () => {
  withEnv('TNF_AGENT_ID', 'agent_explicit_identity', () => {
    assert.equal(resolveStableAgentId('BROKER-Green', 'claude'), 'agent_explicit_identity');
  });
});

test('a blank TNF_AGENT_ID falls back to derivation rather than an empty id', () => {
  withEnv('TNF_AGENT_ID', '   ', () => {
    const id = resolveStableAgentId('BROKER-Green', 'claude');
    assert.notEqual(id.trim(), '');
    assert.match(id, /^agent_broker-green_[0-9a-f]{12}$/);
  });
});

test('names that slugify to nothing still produce a usable id', () => {
  withEnv('TNF_AGENT_ID', undefined, () => {
    const id = resolveStableAgentId('!!!', 'claude');
    assert.match(id, /^agent_agent_[0-9a-f]{12}$/);
  });
});
