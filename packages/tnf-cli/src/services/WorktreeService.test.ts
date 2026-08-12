/**
 * Behaviour guard for `tnf worktree` / `tnf tui --worktree`.
 *
 * `--worktree` was previously a description-only root flag that created
 * nothing. This drives the real service against a throwaway git repo, so the
 * assertions cover the parts that actually touch git rather than just the
 * string handling.
 *
 * The safety assertion is the important one: `remove()` must refuse to discard
 * a worktree holding work that exists nowhere else. An agent's uncommitted
 * output disappearing because cleanup was too eager is the expensive failure
 * here, so it is pinned in both directions (refuses without --force, obeys
 * with it).
 *
 * NOTE: the temp repo is deliberately tiny. Creating a worktree of The-New-Fuse
 * itself checks out a multi-GB tree (node_modules are committed), which is not
 * something a unit test should do.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WorktreeError, WorktreeService, sanitizeWorktreeName } from './WorktreeService.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

function throws(name: string, fn: () => unknown): void {
  try {
    fn();
    check(name, false, '(did not throw)');
  } catch {
    check(name, true);
  }
}

console.log('\nworktree — name validation');

check('accepts a plain name', sanitizeWorktreeName('feature-1') === 'feature-1');
check('trims surrounding space', sanitizeWorktreeName('  ok  ') === 'ok');
throws('rejects empty', () => sanitizeWorktreeName(''));
throws('rejects path traversal', () => sanitizeWorktreeName('../escape'));
throws('rejects a slash', () => sanitizeWorktreeName('a/b'));
throws('rejects a leading dash', () => sanitizeWorktreeName('-flaglike'));
throws('rejects dot', () => sanitizeWorktreeName('.'));
throws('rejects spaces inside', () => sanitizeWorktreeName('two words'));

console.log('\nworktree — against a real git repo');

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-worktree-test-'));
const git = (args: string[], cwd = repo) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

try {
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n');
  git(['add', '.']);
  git(['commit', '-qm', 'seed']);

  const service = new WorktreeService(repo);

  check('detects a git repo', service.isGitRepo() === true);
  // The service resolves its repo root, so compare against the resolved form
  // — on macOS `repo` is under /var/folders, which is a symlink to /private.
  check(
    'derives a path under .tnf/worktrees',
    service.pathFor('alpha') === path.join(fs.realpathSync(repo), '.tnf', 'worktrees', 'alpha'),
    service.pathFor('alpha')
  );
  check('namespaces the branch', service.branchFor('alpha') === 'tnf/worktree/alpha');
  check('falls back to HEAD with no remote', service.defaultBaseRef() === 'HEAD');

  const created = service.create({ name: 'alpha', baseRef: 'HEAD' });
  check('create reports it created', created.created === true);
  check('worktree directory exists', fs.existsSync(created.info.worktreePath));
  check(
    'base content is checked out',
    fs.existsSync(path.join(created.info.worktreePath, 'seed.txt'))
  );
  check('git registers it', git(['worktree', 'list']).includes(created.info.worktreePath));
  // Metadata must live OUTSIDE the checkout, or the worktree is dirty from
  // birth and the remove() guard degrades into "always pass --force".
  check(
    'metadata is written beside the worktree, not inside it',
    fs.existsSync(path.join(service.worktreesRoot(), '.meta', 'alpha.json')) &&
      !fs.existsSync(path.join(created.info.worktreePath, '.tnf-worktree.json'))
  );

  const again = service.create({ name: 'alpha', baseRef: 'HEAD' });
  check('create is idempotent — an in-flight session is not clobbered', again.created === false);
  check(
    'idempotent create returns the same path',
    again.info.worktreePath === created.info.worktreePath
  );

  check(
    'list finds it',
    service.list().some((w) => w.name === 'alpha')
  );
  check(
    'list only reports TNF-managed worktrees, not the main checkout',
    service.list().every((w) => w.worktreePath.startsWith(service.worktreesRoot()))
  );

  const cleanStatus = service.status('alpha');
  check('a fresh worktree is clean', cleanStatus.dirtyFiles.length === 0);
  check('a fresh worktree has no unmerged commits', cleanStatus.unmergedCommits.length === 0);

  // --- the safety property ---
  fs.writeFileSync(path.join(created.info.worktreePath, 'agent-output.txt'), 'work\n');
  const dirty = service.status('alpha');
  check(
    'status sees uncommitted work',
    dirty.dirtyFiles.length === 1,
    JSON.stringify(dirty.dirtyFiles)
  );

  const refused = service.remove('alpha');
  check('remove REFUSES to discard uncommitted work', refused.removed === false);
  check(
    'refusal explains why',
    Boolean(refused.reason?.includes('uncommitted')),
    refused.reason ?? ''
  );
  check('refused remove left the worktree intact', fs.existsSync(created.info.worktreePath));
  check(
    'refused remove left the work intact',
    fs.existsSync(path.join(created.info.worktreePath, 'agent-output.txt'))
  );

  const forced = service.remove('alpha', { force: true });
  check('remove --force does discard it', forced.removed === true);
  check('directory is gone', !fs.existsSync(created.info.worktreePath));
  check('git no longer lists it', !git(['worktree', 'list']).includes(created.info.worktreePath));

  check(
    'removing a non-existent worktree is not an error',
    service.remove('ghost').removed === false
  );

  let baseRefError: unknown = null;
  try {
    service.create({ name: 'beta', baseRef: 'no-such-ref' });
  } catch (err) {
    baseRefError = err;
  }
  check('an unresolvable base ref is rejected', baseRefError instanceof WorktreeError);

  console.log('\nworktree — outside a git repo');
  const notRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-not-a-repo-'));
  try {
    const bare = new WorktreeService(notRepo);
    check('isGitRepo is false', bare.isGitRepo() === false);
    check('list degrades to empty rather than throwing', bare.list().length === 0);
    let err: unknown = null;
    try {
      bare.create({ name: 'x' });
    } catch (e) {
      err = e;
    }
    check('create fails with a clear message', err instanceof WorktreeError);
  } finally {
    fs.rmSync(notRepo, { recursive: true, force: true });
  }
} finally {
  fs.rmSync(repo, { recursive: true, force: true });
}

console.log(`\nworktree: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
