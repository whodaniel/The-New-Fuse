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

  if (process.env.TNF_ALLOW_MERGE_COMMIT === '1') {
    console.log(`[merge-guard] ${operation} in progress; TNF_ALLOW_MERGE_COMMIT=1 — proceeding.`);
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
  console.error(`  To finish the ${operation} deliberately:`);
  console.error('    TNF_ALLOW_MERGE_COMMIT=1 git commit');
  console.error('');
  // `merge` / `cherry-pick` / `revert` / `rebase` are all valid git subcommands
  // that accept --abort, so the operation name maps straight through.
  console.error(`  To abandon it:`);
  console.error(`    git ${operation} --abort`);
  console.error('');

  process.exit(1);
}

main();
