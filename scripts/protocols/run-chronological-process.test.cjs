const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('run-chronological-process executes a registered command and writes state history', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-chronological-runner-'));
  const protocolsDir = path.join(tempRoot, 'data', 'protocols');
  const scriptsDir = path.join(tempRoot, 'scripts');
  fs.mkdirSync(protocolsDir, { recursive: true });
  fs.mkdirSync(scriptsDir, { recursive: true });

  const workerScriptPath = path.join(scriptsDir, 'test-worker.cjs');
  fs.writeFileSync(
    workerScriptPath,
    [
      "const fs = require('node:fs');",
      "const path = require('node:path');",
      "const target = path.join(process.cwd(), 'reports', 'runner-proof.txt');",
      "fs.mkdirSync(path.dirname(target), { recursive: true });",
      "fs.writeFileSync(target, 'ok', 'utf8');",
      "console.log(JSON.stringify({ ok: true, target }));",
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(protocolsDir, 'cron-jobs.registry.json'),
    JSON.stringify(
      {
        spec: 'tnf/cron-jobs-registry/0.1',
        jobs: [
          {
            schedule_id: 'tenant-test-runner',
            scope: 'tenant',
            category: 'tenant_automation',
            owner_agent_id: 'test-agent',
            owner_user_id: 'tenant-admin',
            locked: false,
          },
        ],
      },
      null,
      2
    ),
    'utf8'
  );
  fs.writeFileSync(
    path.join(protocolsDir, 'chronological-process-catalog.json'),
    JSON.stringify(
      {
        spec: 'tnf/chronological-process-catalog/0.1',
        entries: {
          'tenant-test-runner': {
            title: 'Tenant Test Runner',
            cadence: 'manual',
            timezone: 'UTC',
            description: 'Test',
            runNow: {
              command: 'node',
              args: ['scripts/test-worker.cjs'],
              timeoutMs: 10000,
            },
          },
        },
      },
      null,
      2
    ),
    'utf8'
  );
  fs.writeFileSync(
    path.join(protocolsDir, 'cron-jobs.control-plane-state.json'),
    JSON.stringify(
      {
        spec: 'tnf/cron-jobs-control-plane-state/0.1',
        updated_at: new Date(0).toISOString(),
        overrides: {},
        runtime: {},
        history: {},
      },
      null,
      2
    ),
    'utf8'
  );

  const scriptPath = path.join(
    process.cwd(),
    'scripts',
    'protocols',
    'run-chronological-process.cjs'
  );
  const stdout = execFileSync(
    'node',
    [scriptPath, '--process-id', 'tenant-test-runner', '--actor-id', 'test-master-clock'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TNF_REPO_ROOT: tempRoot,
      },
      encoding: 'utf8',
    }
  );

  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.run.status, 'healthy');

  const nextState = JSON.parse(
    fs.readFileSync(path.join(protocolsDir, 'cron-jobs.control-plane-state.json'), 'utf8')
  );
  assert.equal(nextState.runtime['tenant-test-runner'].status, 'healthy');
  assert.equal(nextState.history['tenant-test-runner'].length, 1);
  assert.ok(fs.existsSync(path.join(tempRoot, 'reports', 'runner-proof.txt')));

  fs.rmSync(tempRoot, { recursive: true, force: true });
});
