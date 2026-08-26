#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { scanAssimilationSurfaces } = require('./assimilation-scan.cjs');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-assim-scan-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-assim-home-'));
  const write = (rel, body) => {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  };
  write(
    'data/harness/agent-resource-fabric.json',
    JSON.stringify({ hosts: [{ id: 'claude' }, { id: 'zcode' }] })
  );
  write(
    'data/harness/provider-failover-policy.json',
    JSON.stringify({ hostPins: { claude: {}, zcode: {} } })
  );
  write('.agent/skills/tnf-parody-assimilate-cycle/SKILL.md', '# parody');
  write('.agent/skills/tnf-skill-ubiquity-propagation/SKILL.md', '# ubiquity');
  write('.skills/example/SKILL.md', '# mirror');
  write(
    'scripts/harness/agent-resource-converge.cjs',
    "console.log(JSON.stringify({summary:{duplicateGroups:3,reclaimableBytes:42,eligibleFiles:5,excludedFiles:2}}));"
  );
  return { root, home };
}

test('scan composes existing authorities and flags stale legacy seams', (t) => {
  const f = fixture();
  t.after(() => {
    fs.rmSync(f.root, { recursive: true, force: true });
    fs.rmSync(f.home, { recursive: true, force: true });
  });
  const report = scanAssimilationSurfaces(f);
  assert.equal(report.authorities.resourceFabric.hostProfiles, 2);
  assert.equal(report.authorities.providerPolicy.hostPins, 2);
  assert.equal(report.resourceFabricScan.ok, true);
  assert.equal(report.resourceFabricScan.reclaimableBytes, 42);
  assert.ok(report.staleSeams.some((item) => item.id === 'legacy-assimilation-routes-absent'));
  assert.ok(
    report.staleSeams.some((item) => item.id === 'legacy-self-evolution-flywheel-absent')
  );
  assert.equal(report.outputRouting.reusableReadMostlyArtifact, 'agent-resource-fabric');
});

test('receipt is machine-local and does not invent a canonical assimilation routing registry', (t) => {
  const f = fixture();
  t.after(() => {
    fs.rmSync(f.root, { recursive: true, force: true });
    fs.rmSync(f.home, { recursive: true, force: true });
  });
  const report = scanAssimilationSurfaces({ ...f, writeReceipt: true });
  assert.ok(report.receipt.latest.startsWith(path.join(f.home, '.tnf', 'assimilation', 'receipts')));
  const body = fs.readFileSync(report.receipt.latest, 'utf8');
  assert.match(body, /do-not-resurrect-as-parallel-registry/);
  assert.doesNotMatch(body, /"assimilationRoutes"/);
});
