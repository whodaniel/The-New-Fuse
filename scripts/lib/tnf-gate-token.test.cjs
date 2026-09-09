const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const LIB = path.join(__dirname, 'tnf-gate-token.cjs');

/**
 * CREDENTIAL_PATHS is computed from os.homedir() at module load, so each case
 * runs in a child process with HOME pointed at a scratch directory.
 */
function inHome(files, body, env = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-gate-lib-'));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(home, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    }
    // Bodies may be sync or async (verifyGateToken returns a promise).
    const script = `
      const lib = require(${JSON.stringify(LIB)});
      Promise.resolve((${body})(lib, ${JSON.stringify(home)})).then((out) => {
        process.stdout.write(JSON.stringify(out));
      });
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
      encoding: 'utf8',
      env: { ...process.env, HOME: home, TNF_GATE_POLICY_TOKEN: '', ...env },
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

test('env wins over credential files', () => {
  const out = inHome(
    { '.tnf/credentials.env': 'TNF_GATE_POLICY_TOKEN=from-file\n' },
    (lib) => lib.resolveGateToken(),
    { TNF_GATE_POLICY_TOKEN: 'from-env' },
  );
  assert.equal(out.token, 'from-env');
  assert.equal(out.source, 'env');
});

test('credentials.env is read when env is empty, including export/quotes', () => {
  const out = inHome(
    { '.tnf/credentials.env': '# comment\nexport TNF_GATE_POLICY_TOKEN="quoted-value"\n' },
    (lib) => lib.resolveGateToken(),
  );
  assert.equal(out.token, 'quoted-value');
  assert.match(out.source, /credentials\.env$/);
});

test('.tnf.local.env is the documented fallback', () => {
  const out = inHome(
    { '.tnf.local.env': 'TNF_GATE_POLICY_TOKEN=fallback\n' },
    (lib) => lib.resolveGateToken(),
  );
  assert.equal(out.token, 'fallback');
  assert.match(out.source, /\.tnf\.local\.env$/);
});

test('absent everywhere resolves empty rather than throwing', () => {
  const out = inHome({}, (lib) => lib.resolveGateToken());
  assert.equal(out.token, '');
  assert.equal(out.source, '');
});

test('persist replaces the existing entry, keeps neighbours, and writes 0600', () => {
  const out = inHome(
    { '.tnf/credentials.env': 'OTHER_SECRET=keep-me\nTNF_GATE_POLICY_TOKEN=old\n' },
    (lib, home) => {
      const written = lib.persistGateToken('new-token');
      const body = require('node:fs').readFileSync(written, 'utf8');
      const mode = require('node:fs').statSync(written).mode & 0o777;
      return { body, mode, resolved: lib.resolveGateToken().token, home };
    },
  );
  assert.equal(out.mode, 0o600, 'a secret file must not be group/world readable');
  assert.match(out.body, /OTHER_SECRET=keep-me/, 'unrelated entries must survive');
  assert.equal(
    (out.body.match(/TNF_GATE_POLICY_TOKEN=/g) || []).length,
    1,
    'must replace, not append a second entry',
  );
  assert.equal(out.resolved, 'new-token');
});

test('persist refuses an empty token', () => {
  const out = inHome({}, (lib) => {
    try {
      lib.persistGateToken('   ');
      return { threw: false };
    } catch (err) {
      return { threw: true, message: err.message };
    }
  });
  assert.equal(out.threw, true);
  assert.match(out.message, /empty/);
});

test('verify reports a missing token as rejected without a network call', () => {
  const out = inHome({}, (lib) => lib.verifyGateToken(''));
  assert.equal(out.state, 'rejected');
});

test('verify reports an unreachable endpoint as unverified, not as a bad token', () => {
  const out = inHome({}, (lib) =>
    lib.verifyGateToken('some-token', {
      // Reserved TEST-NET-1 address; connection cannot succeed.
      endpoint: 'http://192.0.2.1:9/',
      timeoutMs: 300,
    }),
  );
  assert.equal(out.state, 'unreachable', 'offline must not be reported as a rejected credential');
});
