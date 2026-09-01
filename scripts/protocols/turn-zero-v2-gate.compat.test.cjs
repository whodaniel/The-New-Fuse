#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const test = require('node:test');
const { normalizeOrigin, repositoryMode, validateClassification, hydrationReceipt } = require('./turn-zero-v2-gate.cjs');

test('preserves canonical origin normalization', () => {
  assert.strictEqual(normalizeOrigin('https://github.com/whodaniel/tnf-monorepo.git'), 'whodaniel/tnf-monorepo');
  assert.strictEqual(normalizeOrigin('git@github.com:whodaniel/tnf-monorepo.git'), 'whodaniel/tnf-monorepo');
});
test('preserves repository modes', () => {
  assert.strictEqual(repositoryMode('whodaniel/tnf-monorepo'), 'canonical-development');
  assert.strictEqual(repositoryMode('whodaniel/The-New-Fuse'), 'downstream-publication-target');
});
test('preserves classification safety', () => {
  assert.strictEqual(validateClassification({ workDomain:'personal', artifactDestination:'oss_runtime', dataResidency:'bounded_working', sensitivity:'restricted' }).ok, false);
  assert.strictEqual(validateClassification({ workDomain:'corporate', artifactDestination:'oss_runtime', dataResidency:'product_state', sensitivity:'public' }).ok, true);
});
test('engineering task routes through the engineering context meta-skill', () => {
  const paths = hydrationReceipt('implement TNF architecture change');
  assert.ok(paths.includes('.agent/skills/tnf-engineering-context/SKILL.md'));
});
test('source governance task routes through concordance protocol', () => {
  const paths = hydrationReceipt('reconcile Gemini Drive source taxonomy');
  assert.ok(paths.includes('docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md'));
});
