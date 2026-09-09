'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { install, handle, consumeWake, stateDir, writeJson } = require('./codex-lifecycle.cjs');
const ROOT = path.resolve(__dirname, '../..');
function temp(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-codex-test-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}
test('installer preserves foreign hooks and is idempotent', (t) => {
  const home = temp(t);
  const file = path.join(home, '.codex/hooks.json');
  const foreign = { hooks: [{ type: 'command', command: 'true' }] };
  writeJson(file, { description: 'User hooks', hooks: { Stop: [foreign] } });
  install(home);
  const first = fs.readFileSync(file, 'utf8');
  install(home);
  assert.equal(fs.readFileSync(file, 'utf8'), first);
  const hooks = JSON.parse(first);
  assert.equal(hooks.description, 'User hooks');
  assert.deepEqual(hooks.hooks.Stop[0], foreign);
  assert.equal(hooks.hooks.Stop.length, 2);
  assert.ok(fs.statSync(path.join(home, '.agents/skills/tnf/SKILL.md')).isFile());
});
test('installer retains foreign handlers in a mixed hook group', (t) => {
  const home = temp(t),
    file = path.join(home, '.codex/hooks.json');
  writeJson(file, {
    hooks: {
      Stop: [
        {
          matcher: '*',
          hooks: [
            { type: 'command', command: 'true', statusMessage: 'TNF Codex lifecycle' },
            { type: 'command', command: 'foreign-command' },
          ],
        },
      ],
    },
  });
  install(home);
  const groups = JSON.parse(fs.readFileSync(file)).hooks.Stop;
  assert.deepEqual(groups[0], {
    matcher: '*',
    hooks: [{ type: 'command', command: 'foreign-command' }],
  });
});
test('installer refuses to replace an unrelated skill', (t) => {
  const home = temp(t),
    skill = path.join(home, '.agents/skills/tnf');
  fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(skill, 'SKILL.md'), 'owned');
  assert.throws(() => install(home), /Existing skill/);
  assert.equal(fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8'), 'owned');
});
test('wake expires and is consumed at most once', (t) => {
  const dir = stateDir(temp(t), '../unsafe-session');
  assert.match(path.basename(dir), /^[a-f0-9]{64}$/);
  writeJson(path.join(dir, 'wake.json'), {
    status: 'armed',
    expiresAt: new Date(1000).toISOString(),
  });
  assert.equal(consumeWake(dir, 2000), false);
  writeJson(path.join(dir, 'wake.json'), { status: 'armed', expiresAt: 'invalid' });
  assert.equal(consumeWake(dir, 2000), false);
  writeJson(path.join(dir, 'wake.json'), {
    status: 'armed',
    expiresAt: new Date(5000).toISOString(),
  });
  assert.equal(consumeWake(dir, 2000), true);
  assert.equal(consumeWake(dir, 2000), false);
});
test('Stop retries do not publish duplicate handoffs or rearm wake', (t) => {
  const home = temp(t),
    dir = stateDir(home, 'session');
  let count = 0;
  const event = { session_id: 'session', turn_id: 'turn', hook_event_name: 'Stop' };
  const execute = {
    run: () => {
      count++;
      return JSON.stringify({
        ok: true,
        sessionId: 'session',
        handoffId: 'test-unit-only',
        recordPath: '/unit-test-only',
        critic: { status: 'completed' },
      });
    },
  };
  writeJson(path.join(dir, 'wake.json'), {
    status: 'armed',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  });
  assert.equal(handle(event, home, execute).decision, 'block');
  assert.equal(handle(event, home, execute).decision, undefined);
  assert.equal(count, 1);
  assert.equal(handle({ ...event, stop_hook_active: true }, home, execute).decision, undefined);
  assert.equal(handle({ ...event, stop_hook_active: true }, home, execute).decision, undefined);
  assert.equal(count, 2);
});
test('failed Turn End does not consume authorized wake', (t) => {
  const home = temp(t),
    dir = stateDir(home, 'session');
  writeJson(path.join(dir, 'wake.json'), {
    status: 'armed',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  });
  assert.throws(
    () =>
      handle({ session_id: 'session', turn_id: 't', hook_event_name: 'Stop' }, home, {
        run: () => {
          throw new Error('registry unavailable');
        },
      }),
    /registry unavailable/
  );
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'wake.json'))).status, 'armed');
});
test('real scoped Turn End publishes schema-valid registry records without checkout writes', (t) => {
  const home = temp(t);
  const protectedFiles = [
    'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
    'docs/protocols/AGENT_STATUS_LEDGER.md',
    'docs/protocols/handoff-registry.json',
  ];
  const hashes = () =>
    protectedFiles.map((f) =>
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(ROOT, f)))
        .digest('hex')
    );
  const before = hashes();
  const result = spawnSync(
    process.execPath,
    ['scripts/turn-end-v2.cjs', '--scoped', '--summary', 'Isolated lifecycle integration test'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        TNF_HANDOFF_HOME: home,
        TNF_SESSION_ID: 'scoped-integration-test',
        TNF_CRITIC_DISABLED: '1',
        TNF_WORK_DOMAIN: 'core',
        TNF_ARTIFACT_DESTINATION: 'external',
        TNF_DATA_RESIDENCY: 'product_state',
        TNF_DATA_SENSITIVITY: 'internal',
      },
    }
  );
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  const body = JSON.parse(fs.readFileSync(receipt.recordPath));
  assert.equal(body.session_id, 'scoped-integration-test');
  assert.deepEqual(body.changed_paths, []);
  const indexes = fs.readdirSync(path.join(home, 'handoffs'));
  const registry = JSON.parse(
    fs.readFileSync(path.join(home, 'handoffs', indexes[0], 'registry.json'))
  );
  assert.equal(registry.rows.find((row) => row.handoff_id === body.handoff_id).repo_body_uri, null);
  assert.deepEqual(hashes(), before);
  const Ajv = require('ajv/dist/2020');
  const ajv = new Ajv({ strict: false });
  require('ajv-formats')(ajv);
  const validate = ajv.compile(
    JSON.parse(
      fs.readFileSync(path.join(ROOT, 'docs/protocols/schemas/tnf-session-handoff.schema.json'))
    )
  );
  assert.equal(validate(body), true, JSON.stringify(validate.errors));
});
