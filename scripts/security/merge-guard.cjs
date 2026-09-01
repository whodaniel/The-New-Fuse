#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Refuse to conclude an in-progress merge/rebase/cherry-pick by accident.
 *
 * Why this exists: this repo runs unattended handoff automation that does
 * `git add -A && git commit -m "handoff <id>: commit N uncommitted"`. If a
 * merge is sitting half-resolved when that fires, git happily *concludes the
 * merge* — the resulting commit has two parents and a message that says
 * "handoff". The merge is then invisible in the log, and whatever was in the
 * worktree at that moment becomes the resolution, reviewed by nobody.
 *
 * A real case: `origin/main` was merged in on Jul 28, both conflicts were
 * hand-resolved but never `git add`ed, and the merge sat open for three days
 * with automation running the whole time.
 *
 * Concluding a merge must therefore be a deliberate act:
 *
 *     TNF_ALLOW_MERGE_COMMIT=1 git commit
 *
 * Set that only when you mean "yes, this commit is the merge resolution".
 *
 * 2026-08-27 addendum — the sequence case. A DIFFERENT failure mode: resolving
 * conflicts partway through a multi-commit `git cherry-pick A B` (or `revert`)
 * and then running `TNF_ALLOW_MERGE_COMMIT=1 git commit` per the guidance
 * above. That command is correct advice for a SINGLE-commit operation, but for
 * a sequence it only concludes the current commit — it does not read
 * `.git/sequencer` and advance to the next queued one the way
 * `git cherry-pick --continue` does. The result: the sequence silently ends
 * after the first commit, the remaining ones are never applied, and nothing
 * errors — this guard's own success message reads as confirmation that
 * everything intended just happened. Caught in production only because a
 * separate, unrelated verification step happened to check whether an
 * expected file had actually landed. `git rebase`'s equivalent is
 * `git rebase --continue`; only `merge` truly ends at one `git commit`.
 * `.git/sequencer/todo` existing with unprocessed entries is the reliable
 * signal (git creates it only for multi-item sequences; a single-commit
 * cherry-pick never does) — see hasQueuedSequenceItems() below.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * True when a multi-item cherry-pick/revert sequence has commits still
 * queued beyond the one currently being resolved. `.git/sequencer/todo`
 * only exists at all for a multi-item `git cherry-pick A B ...` / `git revert
 * A B ...` — a single-commit operation never creates it — so its mere
 * presence with at least one non-comment, non-blank line is the signal.
 * Fails closed to "no queued items" on any read error: this function only
 * makes the warning MORE specific, never less blocking, so failing closed
 * here just falls back to the guard's existing generic message.
 */
function hasQueuedSequenceItems(gitDir) {
  const todoPath = path.join(gitDir, 'sequencer', 'todo');
  let content;
  try {
    content = fs.readFileSync(todoPath, 'utf8');
  } catch {
    return { queued: false, count: 0 };
  }
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  return { queued: lines.length > 0, count: lines.length };
}

function main() {
  let gitDir;
  try {
    gitDir = git(['rev-parse', '--git-dir']);
  } catch {
    return; // not a git dir; nothing to guard
  }

  const at = (p) => path.join(gitDir, p);
  const inProgress = [
    ['MERGE_HEAD', 'merge'],
    ['CHERRY_PICK_HEAD', 'cherry-pick'],
    ['REVERT_HEAD', 'revert'],
    ['rebase-merge', 'rebase'],
    ['rebase-apply', 'rebase'],
  ].find(([marker]) => fs.existsSync(at(marker)));

  if (!inProgress) return;

  const [, operation] = inProgress;
  const sequence =
    operation === 'cherry-pick' || operation === 'revert'
      ? hasQueuedSequenceItems(gitDir)
      : { queued: false, count: 0 };

  if (process.env.TNF_ALLOW_MERGE_COMMIT === '1') {
    console.log(`[merge-guard] ${operation} in progress; TNF_ALLOW_MERGE_COMMIT=1 — proceeding.`);
    if (sequence.queued) {
      console.log(
        `[merge-guard] WARNING: ${sequence.count} more commit(s) are queued in this ${operation} sequence. ` +
          `This commit only concludes the CURRENT one — it does not advance the sequence. ` +
          `The remaining ${sequence.count} commit(s) will be silently abandoned unless you run ` +
          `\`git ${operation} --continue\` instead of committing directly.`
      );
    }
    return;
  }

  let unmerged = [];
  try {
    const out = git(['diff', '--name-only', '--diff-filter=U']);
    unmerged = out ? out.split('\n').filter(Boolean) : [];
  } catch {
    /* best effort */
  }

  console.error('');
  console.error(`[merge-guard] BLOCKED: a ${operation} is in progress.`);
  console.error('');
  console.error(
    `  Committing now would conclude the ${operation} with whatever is currently staged,`
  );
  console.error('  under this commit message. If this commit came from handoff automation,');
  console.error(`  that silently buries the ${operation} and its resolution.`);
  console.error('');

  if (unmerged.length) {
    console.error(`  Still unmerged (${unmerged.length}):`);
    for (const f of unmerged.slice(0, 20)) console.error(`    - ${f}`);
    if (unmerged.length > 20) console.error(`    … and ${unmerged.length - 20} more`);
    console.error('');
    console.error('  Resolve them, then `git add` each one.');
  } else {
    console.error('  No unmerged paths remain — the resolution just needs staging.');
  }

  console.error('');

  if (sequence.queued) {
    console.error(
      `  ⚠ This is ONE STEP of a multi-commit ${operation} with ${sequence.count} more`
    );
    console.error(
      `    commit(s) still queued. \`git commit\` — even with the override below —`
    );
    console.error(
      `    only concludes THIS commit; it does not advance the sequence. The`
    );
    console.error(
      `    remaining ${sequence.count} commit(s) would be silently abandoned, with no error.`
    );
    console.error('');
    console.error(`  To finish this step AND continue to the rest (usually what you want):`);
    console.error(`    git ${operation} --continue`);
    console.error('');
    console.error(`  To deliberately end the sequence here and abandon the rest:`);
    console.error('    TNF_ALLOW_MERGE_COMMIT=1 git commit');
  } else {
    console.error(`  To finish the ${operation} deliberately:`);
    console.error('    TNF_ALLOW_MERGE_COMMIT=1 git commit');
  }

  console.error('');
  // `merge` / `cherry-pick` / `revert` / `rebase` are all valid git subcommands
  // that accept --abort, so the operation name maps straight through.
  console.error(`  To abandon it:`);
  console.error(`    git ${operation} --abort`);
  console.error('');

  process.exit(1);
}

main();
