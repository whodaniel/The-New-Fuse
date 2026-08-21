#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Pre-mutation guard — TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL §5, rules R1/R2.
 *
 * TNF's gates are strong at COMMIT time and absent at MUTATION time. On
 * 2026-08-09 no gate objected while a maintenance job stashed 138 files
 * belonging to three agents, then merged and switched branches — erasing ~30
 * files of uncommitted work, twice. Several gates meanwhile correctly blocked a
 * well-formed commit. This closes that asymmetry.
 *
 * Refuses HEAD-moving / tree-mutating operations while the working tree holds
 * work that is not yet committed, because those operations are exactly what
 * destroys it.
 *
 * The untracked count is reported separately and deliberately: `git stash push`
 * does NOT capture untracked files, so "I stashed first" is not protection. On
 * 2026-08-09 `packages/claw-skills/` — which openclaw and picoclaw symlink into
 * — was untracked throughout and would have been destroyed by a `git clean`.
 *
 * Usage
 *   node scripts/security/workspace-mutation-guard.cjs --check [--json]
 *   node scripts/security/workspace-mutation-guard.cjs --hook <state>   (reference-transaction)
 *
 * Bypass (operator, deliberate):
 *   TNF_MUTATION_OK=1 <your git command>
 *
 * FAILS OPEN. A guard that bricks git is worse than no guard: any internal
 * error, unknown state, or missing signal allows the operation.
 *
 * COVERAGE — stated honestly, because a guard trusted beyond its reach is a
 * hazard of its own. This rides `reference-transaction`, which fires only when
 * refs change. Verified in a sandbox on 2026-08-09:
 *
 *   git stash push        BLOCKED   (creates refs/stash) — the 2026-08-09 destroyer
 *   git reset --hard      BLOCKED   (moves HEAD)
 *   git merge / rebase    BLOCKED   (move HEAD)
 *   git commit            allowed   (verified: normal commits pass untouched)
 *   git checkout <branch> allowed   (git carries or refuses; not a destroyer)
 *
 * NOT COVERED — no ref is updated, so no hook can see them:
 *   git clean -fd         invisible to this hook
 *   git checkout -- .     invisible to this hook
 *   git checkout -f       indistinguishable from a safe checkout by reflog action
 *
 * For those, call `--check` explicitly before mutating (§5 of the protocol).
 */

const { spawnSync } = require('node:child_process');

const BYPASS_ENV = 'TNF_MUTATION_OK';

/**
 * Build output and vendored trees. Losing these costs a rebuild, not work, so
 * they must not trip the guard — a guard that fires on routine build churn gets
 * bypassed reflexively and protects nothing. (This repo currently tracks ~30k
 * node_modules files, so without this filter the guard would fire constantly.)
 */
const NON_AUTHORED = [
  /(^|\/)node_modules\//,
  /(^|\/)dist(-v\d+)?\//,
  /(^|\/)build\//,
  /(^|\/)coverage\//,
  /(^|\/)\.turbo\//,
  /(^|\/)target\//,
  /\.tsbuildinfo$/,
];

const isAuthored = (file) => !NON_AUTHORED.some((re) => re.test(file));

/**
 * Reflog actions that DISCARD working-tree state. Commits are deliberately not
 * here, and neither is plain `checkout: moving from` — sandbox testing showed
 * git already carries local modifications across a branch switch and refuses
 * outright when a checkout would clobber them, so blocking it would be a false
 * positive on a frequent, safe operation. False positives are how guards get
 * bypassed reflexively, which is worse than no guard at all.
 *
 * `git stash` is the one that actually destroyed work on 2026-08-09: it clears
 * the tree and silently omits untracked files.
 */
const DANGEROUS_ACTIONS = [/^reset/i, /^merge/i, /^rebase/i, /^pull/i];

/**
 * Reflog / maintenance actions that rewrite refs without discarding the working
 * tree. `git pack-refs` may include `refs/stash` in a multi-ref transaction when
 * a stash exists; that must not be classified as `git stash` (false positive
 * that blocks `git gc` on dirty trees — observed 2026-08-20).
 */
const SAFE_MAINTENANCE_ACTIONS = [
  /^gc\b/i,
  /^pack-refs\b/i,
  /^prune\b/i,
  /^repack\b/i,
  /^maintenance\b/i,
  /^commit-graph\b/i,
  /^multi-pack-index\b/i,
];

/**
 * Parse reference-transaction stdin lines (`<old> <new> <refname>`).
 */
function parseRefTransactionLines(stdin) {
  const refNames = [];
  for (const raw of String(stdin || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      refNames.push(parts[parts.length - 1]);
      continue;
    }
    // Fail open on unexpected shapes: only count explicit stash mentions.
    if (/\brefs\/stash\b/.test(line)) refNames.push('refs/stash');
  }
  return refNames;
}

function isStashRefName(refName) {
  return refName === 'refs/stash' || refName.startsWith('refs/stash/');
}

/**
 * True when this transaction is a stash mutation — not merely a multi-ref
 * rewrite that happens to mention an existing stash (pack-refs / gc).
 */
function isStashMutation(stdin, action) {
  if (/stash/i.test(action || '')) return true;
  const refNames = parseRefTransactionLines(stdin);
  const stashRefs = refNames.filter(isStashRefName);
  if (stashRefs.length === 0) return false;
  // Solely stash ref updates ⇒ stash operation.
  if (refNames.length > 0 && stashRefs.length === refNames.length) return true;
  return false;
}

function isSafeMaintenance(action) {
  if (!action) return false;
  return SAFE_MAINTENANCE_ACTIONS.some((re) => re.test(action));
}

/**
 * Strips trailing newlines only — NOT a full `.trim()`.
 *
 * `git status --porcelain` encodes staged-vs-worktree state in the first two
 * columns, and an unstaged-only change leads with a SPACE (` M a.txt`). A
 * `.trim()` ate that space on the first line, so the filename parsed as
 * `.txt` and the file was reported as staged when it was not — a wrong filename
 * inside a data-loss warning, which is the one place it must be right.
 */
function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return (r.stdout || '').replace(/\n+$/, '');
}

/** Working-tree state, split by what a stash would and would not save. */
function inspectTree() {
  const porcelain = git(['status', '--porcelain', '--untracked-files=normal']);
  if (porcelain === null) return null; // not a repo / git failed → fail open

  const tracked = [];
  const untracked = [];
  const staged = [];
  const noise = [];
  for (const line of porcelain.split('\n').filter(Boolean)) {
    const code = line.slice(0, 2);
    const file = line.slice(3);
    if (!isAuthored(file)) {
      noise.push(file);
      continue;
    }
    if (code === '??') untracked.push(file);
    else {
      tracked.push(file);
      if (code[0] !== ' ' && code[0] !== '?') staged.push(file);
    }
  }
  return {
    tracked,
    untracked,
    staged,
    noise,
    dirty: tracked.length + untracked.length,
  };
}

function summarize(state) {
  const lines = [];
  lines.push(`  tracked modifications : ${state.tracked.length}`);
  lines.push(`  staged                : ${state.staged.length}`);
  lines.push(
    `  UNTRACKED             : ${state.untracked.length}` +
      (state.untracked.length ? '   <-- `git stash` will NOT save these' : '')
  );
  if (state.noise.length) {
    lines.push(`  (ignored build churn  : ${state.noise.length})`);
  }
  const sample = [...state.tracked, ...state.untracked].slice(0, 8);
  if (sample.length) {
    lines.push('');
    lines.push('  at risk (first 8):');
    for (const f of sample) lines.push(`    ${f}`);
    const more = state.dirty - sample.length;
    if (more > 0) lines.push(`    …and ${more} more`);
  }
  return lines.join('\n');
}

/**
 * TNF_COLLISION_PROVISION §4.4 — every collision is appended to COLLISION_LOG.
 * A block is a collision that was caught rather than survived, and it is the
 * only record that this guard did anything: the refusal text goes to a terminal
 * nobody may be watching.
 *
 * Best-effort by design. A guard that fails because it could not write its own
 * audit line would be worse than one that stays quiet.
 */
function logCollision(action, state) {
  try {
    const root = git(['rev-parse', '--show-toplevel']);
    if (!root) return;
    const dir = require('node:path').join(root, 'data', 'protocols');
    require('node:fs').mkdirSync(dir, { recursive: true });
    require('node:fs').appendFileSync(
      require('node:path').join(dir, 'COLLISION_LOG.jsonl'),
      `${JSON.stringify({
        at: new Date().toISOString(),
        type: 'C2',
        detector: 'workspace-mutation-guard',
        action,
        branch: git(['branch', '--show-current']) || '(detached)',
        resolution: 'blocked',
        tracked: state.tracked.length,
        staged: state.staged.length,
        untracked: state.untracked.length,
        sample: [...state.tracked, ...state.untracked].slice(0, 20),
      })}\n`
    );
  } catch {
    /* never let auditing break the guard */
  }
}

/**
 * `blocked` distinguishes an operation we actually stopped (hook mode) from an
 * advisory `--check` that merely reported a dirty tree. Only the former is a
 * collision; logging every inspection would bury the real events.
 */
function refuse(action, state, blocked = false) {
  if (blocked) logCollision(action, state);
  const branch = git(['branch', '--show-current']) || '(detached)';
  console.error('');
  console.error('[workspace-mutation-guard] BLOCKED');
  console.error('');
  console.error(`  operation : ${action}`);
  console.error(`  branch    : ${branch}`);
  console.error('');
  console.error(summarize(state));
  console.error('');
  console.error('  This tree has uncommitted work. HEAD-moving operations destroy it,');
  console.error('  and stashing does not reliably protect it (see untracked count).');
  console.error('');
  console.error('  Park it durably instead — this captures tracked AND untracked:');
  console.error('');
  console.error('    git add -A && git commit -m "wip: parked before maintenance"');
  console.error('    # or, to keep it off this branch:');
  console.error('    git switch -c wip/$(date +%Y%m%d-%H%M%S) && git add -A && git commit -m wip');
  console.error('');
  console.error('  Per TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL R1, branch maintenance');
  console.error('  belongs in a separate clone, not a shared checkout.');
  console.error('');
  console.error(`  Operator override:  ${BYPASS_ENV}=1 <command>`);
  console.error('');
  return 1;
}

function isDangerous(action) {
  if (!action) return false;
  return DANGEROUS_ACTIONS.some((re) => re.test(action));
}

/**
 * Hook decision helper exported for unit tests.
 * Returns { block, reason } without inspecting the working tree.
 */
function classifyRefTransaction({ action = '', stdin = '' } = {}) {
  // Maintenance first: pack-refs/gc may rewrite refs/stash among other refs
  // (or even alone) without discarding the working tree.
  if (isSafeMaintenance(action) && !/stash/i.test(action)) {
    return { block: false, reason: 'safe-maintenance' };
  }
  if (isStashMutation(stdin, action)) {
    return { block: true, reason: 'stash-mutation' };
  }
  if (isDangerous(action)) {
    return { block: true, reason: 'dangerous-action' };
  }
  return { block: false, reason: 'benign' };
}

function main(argv) {
  // Explicit operator bypass, checked before anything else.
  if (process.env[BYPASS_ENV] === '1') return 0;

  const hookMode = argv.includes('--hook');
  const json = argv.includes('--json');

  let state;
  try {
    state = inspectTree();
  } catch {
    return 0; // fail open
  }
  if (!state) return 0;

  if (hookMode) {
    // reference-transaction fires for every ref update, including ordinary
    // commits. Only the "prepared" phase can abort, and only reflog actions
    // that move HEAD or discard state are our business.
    const stateArg = argv[argv.indexOf('--hook') + 1];
    if (stateArg !== 'prepared') return 0;

    const action = process.env.GIT_REFLOG_ACTION || '';
    let stdin = '';
    try {
      stdin = require('node:fs').readFileSync(0, 'utf8');
    } catch {
      stdin = '';
    }

    const decision = classifyRefTransaction({ action, stdin });
    // No actionable signal → fail open rather than guess.
    if (decision.reason === 'benign' && !action && !stdin.trim()) return 0;
    if (!decision.block) return 0;
    if (state.dirty === 0) return 0;

    const label =
      decision.reason === 'stash-mutation'
        ? `git stash (${action || 'stash'})`
        : action || decision.reason;
    return refuse(label, state, true);
  }

  // Standalone --check: for maintenance jobs to call before mutating.
  if (json) {
    console.log(
      JSON.stringify(
        {
          safe: state.dirty === 0,
          tracked: state.tracked.length,
          staged: state.staged.length,
          untracked: state.untracked.length,
          untrackedNotSavedByStash: state.untracked.length,
          ignoredBuildChurn: state.noise.length,
        },
        null,
        2
      )
    );
    return state.dirty === 0 ? 0 : 1;
  }

  if (state.dirty === 0) {
    console.log('[workspace-mutation-guard] OK: clean tree, safe to mutate.');
    return 0;
  }
  return refuse('requested tree mutation', state);
}

module.exports = {
  classifyRefTransaction,
  isStashMutation,
  isSafeMaintenance,
  isDangerous,
  parseRefTransactionLines,
  main,
};

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    // Never brick git.
    console.error(`[workspace-mutation-guard] internal error, allowing: ${error.message}`);
    process.exit(0);
  }
}
