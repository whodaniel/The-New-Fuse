#!/usr/bin/env node
'use strict';

/**
 * handoff-registry.test.cjs — exercises the TNF-0108 canonical handoff
 * registry against a throwaway TNF_HANDOFF_HOME. The committed mirror is
 * disabled (mirror:false / backfill mirror:false) so no repo files are
 * touched. Run: node scripts/harness/handoff-registry.test.cjs
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const repoRoot = path.resolve(__dirname, '..', '..');

// Redirect all runtime state (records, registry, lock) to a temp home.
const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-handoff-registry-test-'));
process.env.TNF_HANDOFF_HOME = tempHome;

const registry = require('./handoff-registry.cjs');

function makeHandoff(summaryLine, createdAt) {
  return {
    spec: 'tnf/session-handoff/0.3',
    handoff_id: crypto.randomUUID(),
    created_at: createdAt,
    repository: 'whodaniel/tnf-monorepo',
    repository_context: {
      canonical_source: 'whodaniel/tnf-monorepo',
      actual: 'whodaniel/tnf-monorepo',
      publication_targets: ['whodaniel/The-New-Fuse', 'whodaniel/fuse-control-plane'],
    },
    branch: 'test-branch',
    head_sha: '010cbebd7ff880ae5d290c0bfc774fac4224ca65',
    protocol_ack: 'TNF_PROTOCOL_ACK',
    sensitive_scope: 'internal',
    classification: {
      work_domain: 'core',
      artifact_destination: 'private_control_plane',
      data_residency: 'product_state',
      sensitivity: 'internal',
    },
    capabilities: { required: [], staffed_by: [] },
    publication: { public_runtime_affected: false, control_plane_affected: false, satellites: [] },
    freshness_receipts: [],
    work_summary: [summaryLine],
    changed_paths: ['docs/protocols/HANDOFF_REGISTRY_PROTOCOL.md'],
    verification: {
      privacy_guard: 'na',
      secret_sweep: 'na',
      docs_pii_guard: 'na',
      supabase_rls_audit: 'na',
    },
    continuation: {
      owner: 'test-owner',
      targets: ['story-architect'],
      priority: 'high',
      resume_checklist: ['resume'],
    },
    next_actions: ['next'],
  };
}

// 1. Canonical hashing is order-independent.
const a = registry.hashBody({ x: 1, y: { b: 2, a: 1 } });
const b = registry.hashBody({ y: { a: 1, b: 2 }, x: 1 });
assert.equal(a, b, 'canonical hash must be key-order independent');
assert.match(a, /^[0-9a-f]{64}$/);

// 2. Validation before publication rejects fabricated bodies.
assert.ok(registry.validateBody({}).length > 0, 'empty body must be rejected');
assert.ok(
  registry.validateBody(makeHandoff('ok', new Date().toISOString())).length === 0,
  'well-formed body must pass'
);
assert.throws(
  () => registry.publish({ repoRoot, handoff: { spec: 'tnf/session-handoff/0.3' }, opts: { mirror: false } }),
  /rejected before publication/,
  'publish must refuse an invalid body'
);

// 3. Publish writes an immutable record + active row.
const h1 = makeHandoff('first handoff', '2026-09-06T06:00:00.000Z');
const r1 = registry.publish({ repoRoot, handoff: h1, opts: { mirror: false, taskId: 'TNF-0108', sessionId: 'sess-1' } });
assert.equal(r1.row.state, 'active');
assert.equal(r1.row.task_id, 'TNF-0108');
assert.equal(r1.row.session_id, 'sess-1');
assert.ok(fs.existsSync(r1.recordPath), 'record file must exist');
assert.match(fs.readFileSync(r1.recordPath, 'utf8'), /"record_hash"/, 'record must carry its hash');

// 4. Idempotent publication: same hash → same row, no duplicate.
const r1b = registry.publish({ repoRoot, handoff: h1, opts: { mirror: false, taskId: 'TNF-0108' } });
assert.equal(r1b.idempotent, true);
assert.equal(r1b.row.handoff_id, r1.row.handoff_id);
assert.equal(registry.listRows({ repoRoot }).length, 1);

// 5. Divergent replay of the same handoff id is a no-op — the immutable
//    on-disk record is canonical, its content is never overwritten.
const tampered = { ...h1, work_summary: ['mutated'] };
const r1c = registry.publish({ repoRoot, handoff: tampered, opts: { mirror: false, noSupersede: true } });
assert.equal(r1c.idempotent, true);
assert.equal(JSON.parse(fs.readFileSync(r1.recordPath, 'utf8')).work_summary[0], 'first handoff');

// 6. Explicit supersession on scoped publish.
const h2 = makeHandoff('second handoff', '2026-09-06T06:05:00.000Z');
const r2 = registry.publish({ repoRoot, handoff: h2, opts: { mirror: false } });
assert.equal(r2.row.state, 'active');
assert.deepEqual(r2.superseded, [r1.row.handoff_id], 'new scoped publish must explicitly supersede the prior active record');
const rowsAfterR2 = registry.listRows({ repoRoot });
assert.equal(rowsAfterR2.find((r) => r.handoff_id === r1.row.handoff_id).state, 'superseded');
assert.equal(
  rowsAfterR2.find((r) => r.handoff_id === r1.row.handoff_id).superseded_by,
  r2.row.handoff_id
);
// Original record file untouched (supersession lives in the index).
const r1OnDisk = JSON.parse(fs.readFileSync(r1.recordPath, 'utf8'));
assert.ok(!r1OnDisk.superseded_by, 'immutable record must not be rewritten on supersession');

// 7. noSupersede leaves two active records; latest picks newest.
const h3 = makeHandoff('parallel handoff', '2026-09-06T06:10:00.000Z');
const r3 = registry.publish({ repoRoot, handoff: h3, opts: { mirror: false, noSupersede: true } });
const latest = registry.latestRow(registry.paths(repoRoot).registry ? readRegistryForTest() : null, {});
assert.equal(latest.handoff_id, r3.row.handoff_id, 'latest active record wins for the scope');

function readRegistryForTest() {
  const p = registry.paths(repoRoot);
  return JSON.parse(fs.readFileSync(p.registry, 'utf8'));
}

// 8. Acceptance transition retains evidence semantics.
const accepted = registry.setAcceptance({
  repoRoot,
  handoffId: r2.row.handoff_id,
  state: 'accepted',
  by: 'operator',
  basis: 'verification evidence reviewed',
});
assert.equal(accepted.acceptance.state, 'accepted');
assert.equal(accepted.acceptance.by, 'operator');

// 9. Reconcile rebuilds the index from immutable records (crash recovery).
const p = registry.paths(repoRoot);
fs.rmSync(p.registry, { force: true });
const report = registry.reconcile({ repoRoot });
assert.ok(report.added.length >= 3, `reconcile must re-index records (${report.added.length})`);
assert.equal(report.hashMismatches.length, 0);
const rebuilt = JSON.parse(fs.readFileSync(p.registry, 'utf8'));
const rebuiltR2 = rebuilt.rows.find((r) => r.handoff_id === r2.row.handoff_id);
assert.ok(rebuiltR2, 'r2 must survive reconcile');
assert.equal(rebuiltR2.state, 'active', 'r2 was never superseded (r3 noSupersede, r1 predates)');

// 10. Verify detects a mutated record body.
const verifyOk = registry.verify({ repoRoot });
assert.equal(verifyOk.ok, true);
const recordBody = JSON.parse(fs.readFileSync(r2.recordPath, 'utf8'));
recordBody.work_summary = ['tampered after publication'];
fs.writeFileSync(r2.recordPath, JSON.stringify(recordBody, null, 2));
const verifyBad = registry.verify({ repoRoot });
assert.equal(verifyBad.ok, false, 'verify must catch post-publication mutation');
assert.ok(verifyBad.failures.some((f) => f.handoff_id === r2.row.handoff_id));

// 11. Backfill imports legacy reports additively (no file moves).
const legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-legacy-reports-'));
const legacyBody = makeHandoff('legacy session', '2026-01-01T00:00:00.000Z');
fs.writeFileSync(
  path.join(legacyDir, 'SESSION_HANDOFF_LEGACY_TEST.json'),
  JSON.stringify(legacyBody, null, 2)
);
const bf = registry.backfill({ repoRoot, reportsDir: legacyDir, mirror: false });
assert.equal(bf.imported.length, 1);
const legacyRow = registry.listRows({ repoRoot }).find((r) => r.state === 'legacy' && r.task_id === null);
assert.ok(legacyRow, 'legacy row must be indexed');
assert.match(legacyRow.repo_body_uri, /SESSION_HANDOFF_LEGACY_TEST\.json$/);

// 12. Per-checkout cache view carries scope metadata.
const cacheFile = registry.writeCurrentCache({ repoRoot, row: rebuiltR2, body: legacyBody });
assert.ok(fs.existsSync(cacheFile));
assert.match(fs.readFileSync(cacheFile, 'utf8'), /"_view"/);

fs.rmSync(tempHome, { recursive: true, force: true });
console.log('handoff-registry.test.cjs: OK');
