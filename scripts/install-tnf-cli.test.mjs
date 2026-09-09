import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t, origin, executableExit = 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-install-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'packages/tnf-cli/src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'packages/tnf-cli/src/cli.ts'), '// fixture');
  fs.writeFileSync(path.join(dir, 'tnf'), `#!/bin/sh\nexit ${executableExit}\n`, { mode: 0o755 });
  for (const args of [
    ['init', '-q'],
    ['remote', 'add', 'origin', origin],
  ])
    assert.equal(spawnSync('git', args, { cwd: dir }).status, 0);
  const tools = path.join(dir, 'tools');
  fs.mkdirSync(tools);
  // Package install/build are controlled boundaries; launcher and Git validation execute for real.
  fs.writeFileSync(path.join(tools, 'pnpm'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const env = {
    ...process.env,
    PATH: tools + path.delimiter + process.env.PATH,
    TNF_REPO_DIR: '',
    TNF_ROOT_DIR: '',
    TNF_SKIP_CORE_FLEET: '1',
    TNF_INSTALL_AUTO_ONBOARD: '0',
  };
  return { dir, env };
}
function install(f) {
  return spawnSync(
    'bash',
    [
      path.join(root, 'scripts/install-tnf-cli.sh'),
      '--from-local',
      '--bin-dir',
      path.join(f.dir, 'bin'),
      '--skip-onboard',
    ],
    { cwd: f.dir, env: f.env, encoding: 'utf8', timeout: 10000 }
  );
}
test('official public runtime can run its installed launcher', (t) => {
  const f = fixture(t, 'https://github.com/whodaniel/The-New-Fuse.git');
  const r = install(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(spawnSync(path.join(f.dir, 'bin/tnf'), ['--version'], { env: f.env }).status, 0);
});
test('development origin remains accepted', (t) => {
  assert.equal(install(fixture(t, 'git@github.com:whodaniel/tnf-monorepo.git')).status, 0);
});
test('failed installed executable fails the install', (t) => {
  const r = install(fixture(t, 'https://github.com/whodaniel/The-New-Fuse.git', 9));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /installation is not usable/);
});
test('unrelated origin does not become trusted through installation', (t) => {
  const r = install(fixture(t, 'https://github.com/unrelated/project.git'));
  assert.notEqual(r.status, 0);
});
test('launcher uses current built source without a BSD-only stat dependency', (t) => {
  const f = fixture(t, 'https://github.com/whodaniel/The-New-Fuse.git');
  fs.copyFileSync(path.join(root, 'tnf'), path.join(f.dir, 'tnf'));
  const dist = path.join(f.dir, 'packages/tnf-cli/dist');
  fs.mkdirSync(dist);
  fs.writeFileSync(path.join(dist, 'cli.js'), 'console.log("built-launcher-probe")');
  fs.utimesSync(path.join(f.dir, 'packages/tnf-cli/src/cli.ts'), new Date(1000), new Date(1000));
  const trace = path.join(f.dir, 'pnpm-called');
  fs.writeFileSync(path.join(f.dir, 'tools/pnpm'), `#!/bin/sh\ntouch '${trace}'\nexit 7\n`, {
    mode: 0o755,
  });
  const r = spawnSync('bash', [path.join(f.dir, 'tnf'), '--version'], {
    env: f.env,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /built-launcher-probe/);
  assert(!fs.existsSync(trace));
  fs.utimesSync(
    path.join(f.dir, 'packages/tnf-cli/src/cli.ts'),
    new Date(Date.now() + 10000),
    new Date(Date.now() + 10000)
  );
  spawnSync('bash', [path.join(f.dir, 'tnf'), '--version'], {
    env: f.env,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert(fs.existsSync(trace));
});
test('remote install resolves an exact commit and preserves dirty existing clones', (t) => {
  const f = fixture(t, 'https://github.com/whodaniel/The-New-Fuse.git');
  const git = (...args) => spawnSync('git', args, { cwd: f.dir, encoding: 'utf8' });
  assert.equal(git('add', 'tnf', 'packages').status, 0);
  assert.equal(
    git(
      '-c',
      'user.name=Installer Test',
      '-c',
      'user.email=installer@example.test',
      'commit',
      '-qm',
      'first'
    ).status,
    0
  );
  const first = git('rev-parse', 'HEAD').stdout.trim();
  fs.writeFileSync(path.join(f.dir, 'later'), 'later');
  git('add', 'later');
  assert.equal(
    git(
      '-c',
      'user.name=Installer Test',
      '-c',
      'user.email=installer@example.test',
      'commit',
      '-qm',
      'second'
    ).status,
    0
  );
  const target = path.join(f.dir, 'target');
  const args = [
    path.join(root, 'scripts/install-tnf-cli.sh'),
    '--repo-url',
    f.dir,
    '--ref',
    first,
    '--install-root',
    target,
    '--bin-dir',
    path.join(f.dir, 'bin'),
    '--skip-onboard',
  ];
  // A local fixture remote is intentionally not trusted for execution; Git resolution is real.
  const r = spawnSync('bash', args, { cwd: f.dir, env: f.env, encoding: 'utf8', timeout: 10000 });
  assert.match(r.stderr, /installation is not usable/);
  const clone = path.join(target, 'fuse');
  assert.equal(
    spawnSync('git', ['rev-parse', 'HEAD'], { cwd: clone, encoding: 'utf8' }).stdout.trim(),
    first
  );
  fs.appendFileSync(path.join(clone, 'tnf'), '# local change\n');
  const retry = spawnSync('bash', args, {
    cwd: f.dir,
    env: f.env,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.notEqual(retry.status, 0);
  assert.match(retry.stderr, /local changes/);
  assert.match(fs.readFileSync(path.join(clone, 'tnf'), 'utf8'), /local change/);
});
