#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const railGate = path.join(ROOT, 'scripts/protocols/open-agent-rail-gate.cjs');
const turnZero = require('./turn-zero-v2-gate.cjs');

test('open-agent rail gate passes against checked-in public distribution', () => {
  const result = spawnSync(process.execPath, [railGate, '--no-write', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.ok(payload.rails.length >= 7);
  const paths = new Set(payload.rails.map((r) => r.path));
  assert.ok(paths.has('.agent/SYSTEM_PROMPT.md'));
  assert.ok(paths.has('docs/protocols/TNF_INTEROPERABILITY_KERNEL.md'));
  assert.ok(paths.has('docs/protocols/TNF_OPEN_AGENT_CORE.md'));
});

test('public runtime is a legitimate work surface, not a forced private-upstream redirect', () => {
  assert.equal(turnZero.repositoryMode('whodaniel/The-New-Fuse'), 'public-runtime-source');
  assert.equal(turnZero.repositoryMode('https://github.com/someone/tnf-fork'), 'external-or-fork');
  assert.equal(turnZero.repositoryMode('whodaniel/fuse-control-plane'), 'private-control-plane-source');
});

test('public classification keeps capability separate from boundary', () => {
  const good = turnZero.validateClassification({
    workDomain: 'corporate',
    artifactDestination: 'oss_runtime',
    dataResidency: 'product_state',
    sensitivity: 'public',
  });
  assert.equal(good.ok, true);

  const privateLeak = turnZero.validateClassification({
    workDomain: 'corporate',
    artifactDestination: 'public_contract',
    dataResidency: 'product_state',
    sensitivity: 'private',
  });
  assert.equal(privateLeak.ok, false);
});

test('onboarder verifies public semantic rail before Turn Zero', () => {
  const body = fs.readFileSync(path.join(ROOT, 'scripts/tnf-onboard-twip.cjs'), 'utf8');
  const rail = body.indexOf("scripts/protocols/open-agent-rail-gate.cjs");
  const tz = body.indexOf("scripts/protocols/turn-zero-v2-gate.cjs");
  assert.ok(rail >= 0, 'open-agent rail gate not referenced');
  assert.ok(tz >= 0, 'Turn Zero gate not referenced');
  assert.ok(rail < tz, 'semantic rail must be verified before lower-level Turn Zero');
});

test('open agent core explicitly preserves local autonomy', () => {
  const core = fs.readFileSync(path.join(ROOT, 'docs/protocols/TNF_OPEN_AGENT_CORE.md'), 'utf8');
  assert.match(core, /MUST NOT be reduced to a relay client/i);
  assert.match(core, /without access to private TNF source/i);
  assert.match(core, /Missing hosted optimization does not remove local agency/i);
});
