const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const script = path.join(__dirname, 'validate-substrate-attestation.cjs');

function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-seal-test-'));
  const put = (file, text) => { const p = path.join(root, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); };
  put('scripts/protocols/validate-substrate-attestation.cjs', fs.readFileSync(script));
  put('scripts/lib/tnf-gate-token.cjs', fs.readFileSync(path.join(__dirname, '../lib/tnf-gate-token.cjs')));
  put('package.json', JSON.stringify({ name: 'tnf-seal-fixture', version: '1.0.0', private: true }));
  put('pnpm-workspace.yaml', 'packages: []\n');
  put('pnpm-lock.yaml', 'lockfileVersion: \'9.0\'\nsettings: { autoInstallPeers: true, excludeLinksFromLockfile: false }\nimporters: { \'.\': {} }\n');
  put('node_modules/.pnpm/lock.yaml', 'importers: { \'.\': {} }\nsettings:\n  autoInstallPeers: true\n  excludeLinksFromLockfile: false\nlockfileVersion: \'9.0\'\n');
  for (const pkg of ['infrastructure', 'shared', 'tnf-core', 'tnf-note-taking']) put(`packages/${pkg}/dist/index.js`, 'export const version = 1;\n');
  put('packages/tnf-browser/index.js', 'export const version = 1;\n');
  const run = (...args) => spawnSync(process.execPath, [path.join(root, 'scripts/protocols/validate-substrate-attestation.cjs'), ...args], {
    cwd: root, encoding: 'utf8', env: { ...process.env, TNF_SKIP_SUBSTRATE: '', TNF_REQUIRE_SUBSTRATE: '', NODE_PATH: path.resolve(__dirname, '../../node_modules') }
  });
  try { fn({ root, put, run }); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test('sealing verifies installed lock and build artifacts before replacing a seal', () => fixture(({ root, put, run }) => {
  let result = run('--write-seal', '--seal-only');
  assert.equal(result.status, 0, result.stderr);
  const sealPath = path.join(root, 'docs/operations/tnf-substrate-seal.json');
  const before = fs.readFileSync(sealPath, 'utf8');
  put('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 8\n');
  result = run('--write-seal', '--seal-only');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /refusing to seal/);
  assert.equal(fs.readFileSync(sealPath, 'utf8'), before);
  put('node_modules/.pnpm/lock.yaml', fs.readFileSync(path.join(root, 'pnpm-lock.yaml')));
  put('package.json', JSON.stringify({ name: 'tnf-seal-fixture', dependencies: { 'missing-from-lock': '1.0.0' } }));
  assert.equal(run('--write-seal', '--seal-only').status, 1);
  put('package.json', JSON.stringify({ name: 'tnf-seal-fixture', version: '1.0.0', private: true }));
  fs.unlinkSync(path.join(root, 'packages/shared/dist/index.js'));
  assert.equal(run('--write-seal', '--seal-only').status, 1);
  assert.equal(fs.readFileSync(sealPath, 'utf8'), before);
}));

test('artifact changes invalidate a seal and recovery checks preserve quarantine', () => fixture(({ root, put, run }) => {
  assert.equal(run('--write-seal', '--seal-only').status, 0);
  put('packages/shared/dist/index.js', 'export const version = 2;\n');
  const state = { mode: 'quarantined', failedCycles: 230, quarantineReason: 'five failed cycles' };
  put('docs/operations/tnf-full-auto-state.json', JSON.stringify(state));
  const result = run('--json', '--recovery-check');
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.checks.find(c => c.id === 'cli-critical-dist').ok, false);
  assert.equal(summary.checks.find(c => c.id === 'full-auto-quarantine').ok, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'docs/operations/tnf-full-auto-state.json'))), state);
  assert.equal(JSON.parse(run('--json').stdout).checks.find(c => c.id === 'full-auto-quarantine').ok, false);
}));
