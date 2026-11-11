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

test('AI 7 assimilated extensions: HoH dual-state compaction, System-1 classifier, and roleTiers', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-ai7-assim-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const compaction = require('./compaction-record.cjs');
  const written = compaction.write(
    {
      summary: 'Test HoH dual state and Google Skill State checkpoint',
      stage: 'self_compact',
      hostOpacity: false,
      artifactState: JSON.stringify({ files: ['scripts/harness/compaction-record.cjs'] }),
      evidenceState: JSON.stringify({ verified: ['tsc --noEmit'], unresolvedGaps: 0 }),
      skillState: JSON.stringify({ goal: 'AI 7 assimilation', currentStage: 'verify' }),
    },
    tmpDir
  );
  assert.equal(written.ok, true);
  assert.deepEqual(written.record.artifactState, {
    files: ['scripts/harness/compaction-record.cjs'],
  });
  assert.deepEqual(written.record.evidenceState, {
    verified: ['tsc --noEmit'],
    unresolvedGaps: 0,
  });
  assert.deepEqual(written.record.skillState, {
    goal: 'AI 7 assimilation',
    currentStage: 'verify',
  });

  const failover = require('./provider-failover.cjs');
  const lead = failover.resolveProviderFailover({ role: 'lead_verifier', seed: true });
  assert.equal(lead.role, 'lead_verifier');
  assert.equal(lead.chain[0], 'anthropic');

  const s1Choice = failover.validateSystem1Decision({
    mode: 'choice',
    value: 'refactor',
    options: ['analysis', 'edit', 'refactor'],
    confidence: 0.92,
  });
  assert.equal(s1Choice.ok, true);
  assert.equal(s1Choice.decision, 'refactor');
  assert.equal(s1Choice.abstained, false);

  const s1Abstain = failover.validateSystem1Decision({
    mode: 'score',
    value: 0.85,
    confidence: 0.2,
    minConfidence: 0.5,
  });
  assert.equal(s1Abstain.ok, true);
  assert.equal(s1Abstain.decision, null);
  assert.equal(s1Abstain.abstained, true);
});
