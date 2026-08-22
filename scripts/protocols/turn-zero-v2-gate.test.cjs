#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const test = require('node:test');
const {
  normalizeOrigin,
  repositoryMode,
  validateClassification,
  hydrationReceipt,
} = require('./turn-zero-v2-gate.cjs');

test('normalizes canonical GitHub HTTPS and SSH origins', () => {
  assert.strictEqual(normalizeOrigin('https://github.com/whodaniel/tnf-monorepo.git'), 'whodaniel/tnf-monorepo');
  assert.strictEqual(normalizeOrigin('git@github.com:whodaniel/tnf-monorepo.git'), 'whodaniel/tnf-monorepo');
});

test('classifies canonical, owned publication, and external fork origins', () => {
  assert.strictEqual(repositoryMode('whodaniel/tnf-monorepo'), 'canonical-development');
  assert.strictEqual(repositoryMode('whodaniel/The-New-Fuse'), 'downstream-publication-target');
  assert.strictEqual(repositoryMode('whodaniel/fuse-control-plane'), 'downstream-publication-target');
  assert.strictEqual(repositoryMode('someone/The-New-Fuse'), 'external-or-fork');
});

test('blocks restricted personal content from public OSS destination', () => {
  const result = validateClassification({
    workDomain: 'personal', artifactDestination: 'oss_runtime', dataResidency: 'bounded_working', sensitivity: 'restricted',
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.errors.join('\n'), /cannot target oss_runtime/);
});

test('accepts a complete public corporate OSS classification', () => {
  const result = validateClassification({
    workDomain: 'corporate', artifactDestination: 'oss_runtime', dataResidency: 'product_state', sensitivity: 'public',
  });
  assert.deepStrictEqual(result, { ok: true, unresolved: false, errors: [] });
});

test('unknown values are non-write-ready rather than guessed', () => {
  const result = validateClassification({
    workDomain: 'corporate', artifactDestination: 'unknown', dataResidency: 'unknown', sensitivity: 'unknown',
  });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.unresolved, true);
});

test('relay task hydrates repository boundaries plus relay-core', () => {
  const paths = hydrationReceipt('refactor relay intent context frames');
  assert.ok(paths.includes('data/distribution/product-repo-map.json'));
  assert.ok(paths.includes('data/distribution/oss-app-boundary.json'));
  assert.ok(paths.includes('packages/relay-core'));
});

test('nontrivial engineering task routes through TNF engineering context meta-skill', () => {
  const paths = hydrationReceipt('implement TNF architecture change');
  assert.ok(paths.includes('.agent/skills/tnf-engineering-context/SKILL.md'));
});

test('multi-agent Drive/source work routes through concordance governance', () => {
  const paths = hydrationReceipt('reconcile Gemini Drive source taxonomy across agents');
  assert.ok(paths.includes('docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md'));
  assert.ok(paths.includes('.agent/skills/tnf-source-concordance/SKILL.md'));
});

test('user-context storage work routes to the canonical storage contract instead of inventing a provider path', () => {
  const paths = hydrationReceipt('audit Google Drive user context storage profile');
  assert.ok(paths.includes('docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md'));
  assert.ok(paths.includes('.agent/skills/tnf-user-context-storage/SKILL.md'));
});
