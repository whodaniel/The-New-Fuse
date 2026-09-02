#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function git(args, cwd = process.cwd()) {
  const r = spawnSync('git', args, { encoding: 'utf8', cwd });
  if (r.status !== 0) return null;
  return (r.stdout || '').replace(/\n+$/, '');
}

function main(argv, env = process.env, cwd = process.cwd()) {
  // post-checkout arguments: <previous_head> <new_head> <flag>
  // flag: 1 = branch checkout, 0 = file checkout
  if (argv.length < 3) return 0;
  const prevHead = argv[0];
  const newHead = argv[1];
  const flag = argv[2];

  if (flag !== '1') return 0;

  let gitDir = git(['rev-parse', '--git-dir'], cwd);
  if (!gitDir) return 0;
  if (!path.isAbsolute(gitDir)) {
      gitDir = path.resolve(cwd, gitDir);
  }

  const currentBranch = git(['branch', '--show-current'], cwd) || '(detached)';
  
  const lockFile = path.join(gitDir, 'locked');
  let lockData = 'UNLOCKED';
  if (fs.existsSync(lockFile)) {
    try {
      lockData = fs.readFileSync(lockFile, 'utf8').trim();
    } catch (e) {
      lockData = 'ERROR_READING_LOCK';
    }
  }

  const worktreeName = path.basename(gitDir);

  const logEntry = {
    at: new Date().toISOString(),
    event: 'post-checkout',
    worktree: worktreeName,
    lock: lockData,
    prevHead,
    newHead,
    branch: currentBranch
  };

  const root = git(['rev-parse', '--show-toplevel'], cwd);
  if (!root) return 0;
  
  const auditDir = path.join(root, 'data', 'protocols');
  fs.mkdirSync(auditDir, { recursive: true });
  fs.appendFileSync(
    path.join(auditDir, 'WORKSPACE_AUDIT_LOG.jsonl'),
    JSON.stringify(logEntry) + '\n'
  );

  return 0;
}

module.exports = { main };

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    process.exit(0);
  }
}
