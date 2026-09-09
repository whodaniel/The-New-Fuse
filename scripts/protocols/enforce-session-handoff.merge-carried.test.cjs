#!/usr/bin/env node
/**
 * Proves the handoff gate distinguishes a receipt this commit authored from one a
 * merge carried in.
 *
 * On 2026-09-07 the gate blocked a merge with "Multiple per-agent handoff JSON
 * receipts found in this change set" over two historical reports that arrived
 * byte-identical from the incoming branch. Neither was a claim the commit was
 * making, so the ambiguity it reported did not exist.
 *
 * The risk in fixing that is the opposite error: silently excusing two receipts
 * the commit really did author. Both directions are asserted here, plus the
 * case-sensitivity trap that made the first attempt at the fix a no-op —
 * changedSet is lower-cased while git paths are not, so `git show :<path>` on the
 * lower-cased name fails and every receipt looks "not carried".
 */
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const git = (args, cwd) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-merge-'));
const repo = path.join(root, 'repo');
const reports = path.join(repo, 'docs/protocols/reports');
fs.mkdirSync(reports, { recursive: true });

git(['init', '-q', '-b', 'main'], repo);
git(['config', 'user.email', 't@example.com'], repo);
git(['config', 'user.name', 't'], repo);
fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n');
git(['add', '-A'], repo);
git(['commit', '-qm', 'seed'], repo);

// A branch that commits two receipts with UPPERCASE names — the real-world shape,
// and the one that exposes the lower-casing trap.
git(['checkout', '-q', '-b', 'incoming'], repo);
const carried = [
  'SESSION_HANDOFF_GOOGLE_ACCOUNT_CHOOSER_20260907.json',
  'SESSION_HANDOFF_WORKSPACE_CLEANUP_20260906.json',
];
for (const name of carried) {
  fs.writeFileSync(path.join(reports, name), JSON.stringify({ handoff_id: name }, null, 2));
}
git(['add', '-A'], repo);
git(['commit', '-qm', 'incoming: two historical receipts'], repo);

git(['checkout', '-q', 'main'], repo);
fs.writeFileSync(path.join(repo, 'other.txt'), 'diverge\n');
git(['add', '-A'], repo);
git(['commit', '-qm', 'main diverges'], repo);

// Merge without committing: this is the state the gate inspects.
try {
  git(['merge', '--no-commit', '--no-ff', 'incoming'], repo);
} catch {
  /* --no-commit exits non-zero by design when it stops before committing */
}
assert.ok(fs.existsSync(path.join(repo, '.git', 'MERGE_HEAD')), 'expected a merge in progress');

/** The predicate under test, exercised exactly as the gate applies it. */
function mergeCarriedSet(candidatesLower, filesOriginalCase) {
  const out = new Set();
  try {
    git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], repo);
  } catch {
    return out;
  }
  const originalCase = new Map(filesOriginalCase.map((f) => [f.toLowerCase(), f]));
  for (const f of candidatesLower) {
    const real = originalCase.get(f) || f;
    try {
      if (git(['show', `:${real}`], repo) === git(['show', `MERGE_HEAD:${real}`], repo)) out.add(f);
    } catch {
      /* unreadable: counted as authored */
    }
  }
  return out;
}

const staged = git(['diff', '--cached', '--name-only'], repo).split('\n').filter(Boolean);
const receiptPaths = staged.filter((f) => /session_handoff_.*\.json$/i.test(f));
assert.equal(receiptPaths.length, 2, `expected 2 staged receipts, got ${receiptPaths.length}`);
const lower = receiptPaths.map((f) => f.toLowerCase());

/* --- 1. both are recognised as carried, despite the case mismatch ---------- */
const carriedSet = mergeCarriedSet(lower, staged);
assert.equal(carriedSet.size, 2, `both receipts should be merge-carried, got ${carriedSet.size}`);
console.log('ok  merge-carried receipts recognised (uppercase paths, lower-cased candidates)');

/* --- 2. the lower-cased lookup alone would find nothing -------------------- */
const naive = mergeCarriedSet(lower, lower); // no original-case mapping
assert.equal(naive.size, 0, 'without the case mapping the fix is a silent no-op');
console.log('ok  case mapping is load-bearing — without it, zero are detected');

/* --- 3. a receipt this commit authored is NOT excused ---------------------- */
const authored = 'session_handoff_authored_here-20260907.json';
fs.writeFileSync(path.join(reports, path.basename(authored)), JSON.stringify({ id: 'mine' }));
git(['add', '-A'], repo);
const staged2 = git(['diff', '--cached', '--name-only'], repo).split('\n').filter(Boolean);
const receipts2 = staged2.filter((f) => /session_handoff_.*\.json$/i.test(f));
const carried2 = mergeCarriedSet(
  receipts2.map((f) => f.toLowerCase()),
  staged2
);
const remaining = receipts2.filter((f) => !carried2.has(f.toLowerCase()));
assert.equal(remaining.length, 1, `only the authored receipt should remain, got ${remaining.length}`);
assert.match(remaining[0], /authored_here/, 'the surviving receipt must be the authored one');
console.log('ok  a receipt authored by this commit is still counted (not excused)');

/* --- 4. outside a merge nothing is excused -------------------------------- */
git(['merge', '--abort'], repo);
const outside = mergeCarriedSet(lower, staged);
assert.equal(outside.size, 0, 'with no MERGE_HEAD nothing may be treated as carried');
console.log('ok  outside a merge, no receipt is treated as carried');

fs.rmSync(root, { recursive: true, force: true });
console.log('\nenforce-session-handoff.merge-carried.test.cjs: OK');
