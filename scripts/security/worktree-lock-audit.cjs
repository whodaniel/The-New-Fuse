#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function git(args, cwd = process.cwd()) {
  const r = spawnSync('git', args, { encoding: 'utf8', cwd });
  if (r.status !== 0) return null;
  return (r.stdout || '').replace(/\n+$/, '');
}

function parseWorktrees(porcelain) {
  if (!porcelain) return [];
  const worktrees = [];
  let current = {};
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current.path) worktrees.push(current);
      current = { path: line.substring(9) };
    } else if (line.startsWith('branch ')) {
      current.branch = line.substring(7);
    } else if (line.startsWith('HEAD ')) {
      current.head = line.substring(5);
    } else if (line === 'detached') {
      current.detached = true;
    }
  }
  if (current.path) worktrees.push(current);
  return worktrees;
}

function extractPurposeFromLock(lockData) {
  // Lock format from incident: claude session workflow-builder-consolidation (pid 22464 start Mon Aug 31 22:56:53 2026)
  // Or might just be something simpler.
  // We extract the purpose name.
  const match = lockData.match(/session\s+([^\s]+)\s+\(/);
  if (match) return match[1];
  
  // Fallback: just return the first token if it's not starting with something known
  return lockData.split(/\s+/)[0] || '';
}

function checkMismatches(cwd = process.cwd()) {
  const porcelain = git(['worktree', 'list', '--porcelain'], cwd);
  const worktrees = parseWorktrees(porcelain);
  const violations = [];

  for (const wt of worktrees) {
    let gitDir;
    // Canonical checkout vs linked worktree
    if (fs.existsSync(path.join(wt.path, '.git'))) {
      const gitRef = fs.statSync(path.join(wt.path, '.git'));
      if (gitRef.isDirectory()) {
        gitDir = path.join(wt.path, '.git');
      } else {
        const content = fs.readFileSync(path.join(wt.path, '.git'), 'utf8').trim();
        if (content.startsWith('gitdir: ')) {
          gitDir = content.substring(8);
          if (!path.isAbsolute(gitDir)) {
            gitDir = path.resolve(wt.path, gitDir);
          }
        }
      }
    }

    if (!gitDir) continue;

    const lockFile = path.join(gitDir, 'locked');
    if (!fs.existsSync(lockFile)) continue;

    const lockData = fs.readFileSync(lockFile, 'utf8').trim();
    const purpose = extractPurposeFromLock(lockData);
    
    // Compare purpose to branch name
    // A branch usually matches the purpose or contains it.
    let branchName = wt.branch ? wt.branch.replace('refs/heads/', '') : '(detached)';
    
    // Simple heuristic: if branch name does not contain the purpose and purpose does not contain the branch name
    // Also strip prefixes like feat/, fix/, chore/, etc.
    const strippedBranch = branchName.replace(/^(feat|fix|chore|docs|refactor|test)\//, '');
    
    // If they are completely distinct, it's a mismatch
    if (purpose && branchName !== '(detached)') {
      if (!strippedBranch.includes(purpose) && !purpose.includes(strippedBranch)) {
         // It's a possible violation
         violations.push({
           worktree: wt.path,
           branch: branchName,
           purpose: purpose,
           lockData
         });
      }
    }
  }

  return violations;
}

function main(argv, env = process.env, cwd = process.cwd()) {
  const json = argv.includes('--json');
  
  const violations = checkMismatches(cwd);
  
  if (json) {
    console.log(JSON.stringify(violations, null, 2));
    return violations.length > 0 ? 1 : 0;
  }

  if (violations.length === 0) {
    console.log('[worktree-lock-audit] OK: All locked worktrees match their purpose.');
    return 0;
  }

  console.error('[worktree-lock-audit] WARNING: Found worktrees reused for unrelated tasks:');
  for (const v of violations) {
    console.error(`  - Worktree: ${v.worktree}`);
    console.error(`    Lock purpose: ${v.purpose}`);
    console.error(`    Actual branch: ${v.branch}`);
    console.error(`    Lock data: ${v.lockData}`);
  }
  
  return 1;
}

module.exports = { parseWorktrees, extractPurposeFromLock, checkMismatches, main };

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
