const assert = require('node:assert');
const { parseWorktrees, extractPurposeFromLock } = require('./worktree-lock-audit.cjs');

function testParseWorktrees() {
  const porcelain = `worktree /path/to/repo
HEAD 1234567890abcdef
branch refs/heads/main
worktree /path/to/repo/.claude/worktrees/workflow-builder-consolidation
HEAD abcdef1234567890
branch refs/heads/fix/api-dev-stale-tsbuildinfo`;

  const wts = parseWorktrees(porcelain);
  assert.strictEqual(wts.length, 2);
  assert.strictEqual(wts[0].path, '/path/to/repo');
  assert.strictEqual(wts[0].branch, 'refs/heads/main');
  assert.strictEqual(wts[1].path, '/path/to/repo/.claude/worktrees/workflow-builder-consolidation');
  assert.strictEqual(wts[1].branch, 'refs/heads/fix/api-dev-stale-tsbuildinfo');
  console.log('testParseWorktrees passed');
}

function testExtractPurpose() {
  const data = 'claude session workflow-builder-consolidation (pid 22464 start Mon Aug 31 22:56:53 2026)';
  const purpose = extractPurposeFromLock(data);
  assert.strictEqual(purpose, 'workflow-builder-consolidation');
  console.log('testExtractPurpose passed');
}

testParseWorktrees();
testExtractPurpose();
