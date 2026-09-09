const assert = require('node:assert/strict');
const { test } = require('node:test');
const { evaluate, inspect } = require('./synchronized-review-gate.cjs');
const head = 'a'.repeat(40),
  base = 'b'.repeat(40);
function fixture() {
  return {
    pr: {
      state: 'open',
      draft: false,
      changed_files: 2,
      head: { sha: head },
      base: { sha: base },
      user: { login: 'author' },
    },
    files: [{ filename: 'scripts/protocols/gate.cjs' }, { filename: 'docs/example.md' }],
    reviews: [
      {
        id: 1,
        state: 'APPROVED',
        commit_id: head,
        user: { login: 'owner', type: 'User' },
        body: `TNF_REVIEW_ACK base=${base} surfaces=docs,scripts`,
      },
    ],
    permissions: { owner: 'write' },
  };
}
test('high risk requires authenticated current formal approval covering every surface', () => {
  assert.deepEqual(evaluate(fixture()).approvedBy, ['owner']);
  const f = fixture();
  f.reviews = [];
  assert.throws(() => evaluate(f), /lacks current authorized review/);
});
test('old head, old base, comments, bots, authors and read-only reviewers cannot approve', () => {
  for (const mutate of [
    (f) => (f.reviews[0].commit_id = base),
    (f) => (f.reviews[0].body = `TNF_REVIEW_ACK base=${head} surfaces=docs,scripts`),
    (f) => (f.reviews[0].state = 'COMMENTED'),
    (f) => (f.reviews[0].user.type = 'Bot'),
    (f) => (f.pr.user.login = 'OWNER'),
    (f) => (f.permissions.owner = 'read'),
    (f) => (f.reviews[0].body = 'The Flash critic says approve.'),
    (f) => (f.reviews[0].body = `TNF_REVIEW_ACK base=${base} surfaces=scripts`),
  ]) {
    const f = fixture();
    mutate(f);
    assert.throws(() => evaluate(f), /lacks current authorized review/);
  }
});
test('latest formal state wins; comments preserve approval; requested changes remain blocking', () => {
  const f = fixture();
  f.reviews.push({ ...f.reviews[0], id: 2, state: 'COMMENTED' });
  assert.equal(evaluate(f).approvedBy.length, 1);
  f.reviews.push({ ...f.reviews[0], id: 3, state: 'DISMISSED' });
  assert.throws(() => evaluate(f), /lacks current/);
  f.reviews.push({ ...f.reviews[0], id: 4, state: 'CHANGES_REQUESTED', commit_id: base });
  assert.throws(() => evaluate(f), /Outstanding changes/);
  f.reviews.push({ ...f.reviews[0], id: 5 });
  assert.equal(evaluate(f).approvedBy.length, 1);
});
test('multiple authorized owners can acknowledge separate surfaces', () => {
  const f = fixture();
  f.reviews[0].body = `TNF_REVIEW_ACK base=${base} surfaces=scripts`;
  f.reviews.push({
    ...f.reviews[0],
    id: 2,
    user: { login: 'docs-owner', type: 'User' },
    body: `TNF_REVIEW_ACK base=${base} surfaces=docs`,
  });
  f.permissions['docs-owner'] = 'maintain';
  assert.equal(evaluate(f).approvedBy.length, 2);
});
test('rename out of a sensitive path, hook deletion, and removed gitlinks escalate', () => {
  for (const file of [
    { filename: 'examples/gate.cjs', previous_filename: 'scripts/protocols/gate.cjs' },
    { filename: '.husky/pre-push', status: 'removed' },
    { filename: 'vendor/component', status: 'removed', patch: '-Subproject commit ' + head },
  ]) {
    const f = fixture();
    f.pr.changed_files = 1;
    f.files = [file];
    f.reviews = [];
    assert.throws(() => evaluate(f), /lacks current/);
  }
});
test('incomplete inventories, drafts and closed PRs fail; ordinary changes do not need escalation', () => {
  for (const mutate of [
    (f) => f.pr.changed_files++,
    (f) => (f.pr.draft = true),
    (f) => (f.pr.state = 'closed'),
  ]) {
    const f = fixture();
    mutate(f);
    assert.throws(() => evaluate(f));
  }
  const f = fixture();
  f.files = [{ filename: 'apps/frontend/button.tsx' }];
  f.pr.changed_files = 1;
  f.reviews = [];
  assert.equal(evaluate(f).tier, 'isolate');
});
test('live verifier rechecks base/head after API reads and fails on permission API errors', () => {
  const f = fixture();
  let reads = 0;
  const read = (endpoint) => {
    if (endpoint.includes('/files?')) return f.files;
    if (endpoint.includes('/reviews?')) return f.reviews;
    if (endpoint.includes('/git/trees/')) return { tree: [], truncated: false };
    if (endpoint.includes('/permission')) return { permission: 'write' };
    reads++;
    return reads === 1 ? f.pr : { ...f.pr, base: { sha: head } };
  };
  assert.throws(() => inspect('owner/repo', 1, read), /changed during/);
  assert.throws(
    () =>
      inspect('owner/repo', 1, () => {
        throw new Error('API unavailable');
      }),
    /API unavailable/
  );
});

test('edits to any guarded merge entrypoint require synchronized review', () => {
  for (const filename of [
    'scripts/safe-merge-to-main.sh',
    'scripts/jules-merge-open-prs.sh',
    'scripts/resolve-pr-conflicts.sh',
    'scripts/maintenance/merge-prs.sh',
  ]) {
    const f = fixture();
    f.pr.changed_files = 1;
    f.files = [{ filename }];
    f.reviews = [];
    assert.throws(() => evaluate(f), /lacks current authorized review/);
  }
});
