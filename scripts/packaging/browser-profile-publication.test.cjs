const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const gate = path.resolve(__dirname, '../check-proprietary-leakage.sh');

for (const profilePath of [
  'archive/apps/gemini-bridge-extension/test_runs/one/pw-profile',
  'renamed-run/pw-profile',
  'archive/apps/gemini-bridge-extension/test_runs',
]) {
  test(`publication rejects browser state at ${profilePath}`, (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-profile-gate-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const dir = path.join(root, profilePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'binary-state'), Buffer.from([0, 255, 1, 0]));
    const result = spawnSync('bash', [gate, root], { encoding: 'utf8' });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /browser run\/profile state is present/);
    assert.equal(fs.readFileSync(path.join(dir, 'binary-state')).length, 4);
  });
}

test('publication permits source mentioning profiles without stored profile state', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-profile-gate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'source.js'), "const profile = 'pw-profile';\n");
  const result = spawnSync('bash', [gate, root], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
