const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { inspectPush } = require('./check-push-review.cjs');
const { getChangedFiles } = require('./classify-change-tier.cjs');
const gate = path.join(__dirname, 'check-push-review.cjs');
test('real Git first-branch push inventories local commits; high-risk direct main push stops before publication', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-review-push-'));
  const repo = path.join(root, 'repo'),
    remote = path.join(root, 'remote.git');
  fs.mkdirSync(repo);
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  try {
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'test@example.invalid');
    git('config', 'user.name', 'Test');
    git('config', 'core.hooksPath', path.join(repo, '.git/hooks'));
    git('init', '--bare', '-q', remote);
    git('remote', 'add', 'origin', remote);
    fs.writeFileSync(path.join(repo, 'seed'), 'seed');
    git('add', '.');
    git('commit', '-qm', 'seed');
    git('push', '-u', 'origin', 'main');
    const base = git('rev-parse', 'HEAD');
    const output = path.join(root, 'files.txt');
    fs.writeFileSync(
      path.join(repo, '.git/hooks/pre-push'),
      `#!/bin/sh\nexec '${process.execPath}' '${gate}' '${output}'\n`,
      { mode: 0o755 }
    );
    git('checkout', '-qb', 'feature');
    fs.mkdirSync(path.join(repo, 'scripts/protocols'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'scripts/protocols/gate.cjs'), 'module.exports = 1;');
    git('add', '.');
    git('commit', '-qm', 'high risk');
    git('push', '-u', 'origin', 'feature');
    assert.match(fs.readFileSync(output, 'utf8'), /scripts\/protocols\/gate.cjs/);
    const blocked = spawnSync('git', ['push', 'origin', 'HEAD:main'], {
      cwd: repo,
      encoding: 'utf8',
    });
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /High-risk direct push/);
    assert.equal(git('--git-dir=' + remote, 'rev-parse', 'main'), base);
    git('rm', 'scripts/protocols/gate.cjs');
    git('commit', '-qm', 'remove protocol');
    git('push', 'origin', 'feature');
    assert.match(fs.readFileSync(output, 'utf8'), /scripts\/protocols\/gate.cjs/);
    const deletion = spawnSync('git', ['push', 'origin', ':main'], { cwd: repo, encoding: 'utf8' });
    assert.notEqual(deletion.status, 0);
    assert.match(deletion.stderr, /Creation\/deletion/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test('invalid ranges cannot silently become an empty successful inventory', () => {
  assert.throws(
    () => inspectPush('refs/heads/x invalid refs/heads/y invalid'),
    /Malformed push SHA/
  );
  assert.throws(
    () =>
      inspectPush(`refs/heads/x ${'a'.repeat(40)} refs/heads/y ${'b'.repeat(40)}`, () => {
        throw new Error('missing object');
      }),
    /missing object/
  );
});
test('explicit empty file list is authoritative; missing file list fails closed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-review-list-'));
  try {
    const file = path.join(root, 'files');
    fs.writeFileSync(file, '');
    assert.deepEqual(getChangedFiles('pre-push', file), []);
    assert.throws(() => getChangedFiles('pre-push', file + '-missing'), /Missing file list/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
