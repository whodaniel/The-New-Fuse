const test = require('node:test');
const assert = require('node:assert/strict');

const { selfAudit } = require('./turn-end-reflection.cjs');

/**
 * Gap analysis of Turn End itself. Every case here is a failure Turn End
 * actually produced on 2026-09-06, not a hypothetical.
 */
const baseHandoff = {
  work_summary: ['did the thing'],
  classification: {
    work_domain: 'core',
    artifact_destination: 'oss_runtime',
    data_residency: 'product_state',
    sensitivity: 'public',
  },
  next_actions: ['new action'],
  changed_paths: ['a.txt'],
  reflection: {
    lessons: { considered: true },
    skills: { considered: true },
    gaps: { considered: true, open: [] },
  },
};

const find = (result, id) => result.checks.find((c) => c.id === id);

test('a clean turn produces no findings', () => {
  const r = selfAudit({ handoff: baseHandoff, previous: { work_summary: ['older'] }, dirtyPaths: 1 });
  assert.equal(r.findings, 0, JSON.stringify(r.checks, null, 2));
});

test('carrying the previous handoff’s summary forward is caught', () => {
  // The 2026-09-06 failure: `--help` ran the turn with no --summary, so the
  // previous session's work_summary was emitted as if it were this session's.
  const stale = { ...baseHandoff, work_summary: ['TNF-0108: canonical handoff registry'] };
  const r = selfAudit({
    handoff: stale,
    previous: { work_summary: ['TNF-0108: canonical handoff registry'] },
    dirtyPaths: 1,
  });
  const check = find(r, 'work-summary-not-stale');
  assert.equal(check.ok, false);
  assert.match(check.detail, /identical to the previous handoff/);
});

test('an empty work summary is caught', () => {
  const r = selfAudit({ handoff: { ...baseHandoff, work_summary: [] }, previous: null, dirtyPaths: 0 });
  assert.equal(find(r, 'work-summary-present').ok, false);
});

test('incomplete classification is named field by field', () => {
  const r = selfAudit({
    handoff: { ...baseHandoff, classification: { work_domain: 'core' } },
    previous: null,
    dirtyPaths: 0,
  });
  const check = find(r, 'classification-complete');
  assert.equal(check.ok, false);
  assert.match(check.detail, /artifact_destination/);
  assert.match(check.detail, /sensitivity/);
});

test('an unasked reflection is a finding, not a pass', () => {
  // reflection: null is what every handoff carried before the step was wired in.
  const r = selfAudit({ handoff: { ...baseHandoff, reflection: null }, previous: null, dirtyPaths: 0 });
  const check = find(r, 'reflection-answered');
  assert.equal(check.ok, false);
  assert.match(check.detail, /never asked/);
  assert.equal(find(r, 'gaps-considered').ok, false);
});

test('reflection answered with an explicit "none" passes', () => {
  const answered = {
    ...baseHandoff,
    reflection: {
      lessons: { considered: true, rationale: 'routine fix, nothing generalizable' },
      skills: { considered: true, rationale: 'no new capability' },
      gaps: { considered: true, rationale: 'none left open' },
    },
  };
  const r = selfAudit({ handoff: answered, previous: null, dirtyPaths: 0 });
  assert.equal(find(r, 'reflection-answered').ok, true);
  assert.equal(find(r, 'gaps-considered').ok, true);
});

test('next actions wholly inherited from the previous handoff are caught', () => {
  const inherited = ['Migrate gate consumers to registry-first reads (T6)'];
  const r = selfAudit({
    handoff: { ...baseHandoff, next_actions: inherited },
    previous: { work_summary: ['older'], next_actions: inherited },
    dirtyPaths: 0,
  });
  const check = find(r, 'next-actions-not-all-inherited');
  assert.equal(check.ok, false, 'a turn that adds no next action of its own should be flagged');
});

test('a dirty tree with no recorded changed paths is caught', () => {
  const r = selfAudit({
    handoff: { ...baseHandoff, changed_paths: [] },
    previous: null,
    dirtyPaths: 12,
  });
  assert.equal(find(r, 'changed-paths-recorded').ok, false);
});

test('a clean tree with no changed paths is fine', () => {
  const r = selfAudit({ handoff: { ...baseHandoff, changed_paths: [] }, previous: null, dirtyPaths: 0 });
  assert.equal(find(r, 'changed-paths-recorded').ok, true);
});
