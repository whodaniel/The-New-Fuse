const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function bootstrapTempRepo() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-dont-die-'));
  const protocolsDir = path.join(tempRoot, 'data', 'protocols');
  const scriptsDir = path.join(tempRoot, 'scripts');
  const protocolScriptsDir = path.join(scriptsDir, 'protocols');
  fs.mkdirSync(protocolsDir, { recursive: true });
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.mkdirSync(protocolScriptsDir, { recursive: true });

  const sourceProtocolDir = path.join(process.cwd(), 'scripts', 'protocols');
  for (const scriptName of ['master-clock-sync-audit.cjs', 'run-chronological-process.cjs']) {
    fs.copyFileSync(
      path.join(sourceProtocolDir, scriptName),
      path.join(protocolScriptsDir, scriptName)
    );
  }

  return { tempRoot, protocolsDir, scriptsDir };
}

function runSupervisor(scriptPath, args) {
  const stdout = execFileSync('node', [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(stdout);
}

test('dont-die-supervisor remediates stale run window and sweeps stale lock', () => {
  const { tempRoot, protocolsDir, scriptsDir } = bootstrapTempRepo();
  const nowIso = '2026-03-26T12:00:00.000Z';

  fs.writeFileSync(
    path.join(scriptsDir, 'test-worker.cjs'),
    [
      "const fs = require('node:fs');",
      "const path = require('node:path');",
      "const target = path.join(process.cwd(), 'reports', 'worker-proof.txt');",
      "fs.mkdirSync(path.dirname(target), { recursive: true });",
      "fs.writeFileSync(target, 'ok', 'utf8');",
      "console.log(JSON.stringify({ ok: true, target }));",
    ].join('\n'),
    'utf8'
  );

  writeJson(path.join(protocolsDir, 'cron-jobs.registry.json'), {
    spec: 'tnf/cron-jobs-registry/0.1',
    jobs: [
      {
        schedule_id: 'tenant-test-remediation',
        scope: 'tenant',
        category: 'tenant_automation',
        owner_agent_id: 'test-agent',
        owner_user_id: 'tenant-admin',
        locked: false,
      },
    ],
  });

  writeJson(path.join(protocolsDir, 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tenant-test-remediation': {
        title: 'Tenant Test Remediation',
        cadence: '*/15 * * * *',
        timezone: 'UTC',
        description: 'Test remediation process',
        runNow: {
          command: 'node',
          args: ['scripts/test-worker.cjs'],
          timeoutMs: 10000,
        },
      },
    },
  });

  writeJson(path.join(protocolsDir, 'cron-jobs.control-plane-state.json'), {
    spec: 'tnf/cron-jobs-control-plane-state/0.1',
    updated_at: nowIso,
    overrides: {},
    runtime: {
      'tenant-test-remediation': {
        status: 'healthy',
        lastRunAt: '2026-03-26T09:00:00.000Z',
        lastDurationMs: 1000,
        lastExitCode: 0,
        lastError: null,
      },
    },
    history: {
      'tenant-test-remediation': [
        {
          runId: 'run_1',
          processId: 'tenant-test-remediation',
          actorId: 'tnf-master-clock',
          startedAt: '2026-03-26T08:59:59.000Z',
          finishedAt: '2026-03-26T09:00:00.000Z',
          durationMs: 1000,
          status: 'healthy',
          exitCode: 0,
          error: null,
          outputPreview: 'ok',
        },
      ],
    },
  });

  writeJson(path.join(protocolsDir, 'cron-job-locks', 'tenant-test-remediation.lock.json'), {
    processId: 'tenant-test-remediation',
    actorId: 'tnf-master-clock',
    startedAt: '2026-03-26T10:00:00.000Z',
    pid: 101,
  });

  const scriptPath = path.join(process.cwd(), 'scripts', 'protocols', 'dont-die-supervisor.cjs');
  const parsed = runSupervisor(scriptPath, [
    '--repo-root',
    tempRoot,
    '--json',
    '--no-write-report',
    '--now',
    nowIso,
  ]);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.report.before.summary.escalations.critical > 0, true);
  assert.equal(parsed.report.remediation.totals.attempted, 1);
  assert.equal(parsed.report.remediation.totals.successful, 1);
  assert.equal(parsed.report.remediation.totals.locksSwept, 1);
  assert.equal(parsed.report.after.summary.escalations.critical, 0);

  assert.ok(fs.existsSync(path.join(tempRoot, 'reports', 'worker-proof.txt')));
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('dont-die-supervisor surfaces unresolved enabled process without runNow', () => {
  const { tempRoot, protocolsDir } = bootstrapTempRepo();
  const nowIso = '2026-03-26T12:00:00.000Z';

  writeJson(path.join(protocolsDir, 'cron-jobs.registry.json'), {
    spec: 'tnf/cron-jobs-registry/0.1',
    jobs: [
      {
        schedule_id: 'tenant-missing-run-now',
        scope: 'tenant',
        category: 'tenant_terminal_awareness',
        owner_agent_id: 'test-agent',
        owner_user_id: 'tenant-admin',
        locked: false,
      },
    ],
  });

  writeJson(path.join(protocolsDir, 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tenant-missing-run-now': {
        title: 'Tenant Missing Run Now',
        cadence: '*/30 * * * *',
        timezone: 'UTC',
        description: 'Missing runNow command',
        runNow: null,
      },
    },
  });

  writeJson(path.join(protocolsDir, 'cron-jobs.control-plane-state.json'), {
    spec: 'tnf/cron-jobs-control-plane-state/0.1',
    updated_at: nowIso,
    overrides: {},
    runtime: {},
    history: {},
  });

  const scriptPath = path.join(process.cwd(), 'scripts', 'protocols', 'dont-die-supervisor.cjs');
  const parsed = runSupervisor(scriptPath, [
    '--repo-root',
    tempRoot,
    '--json',
    '--warn-only',
    '--no-write-report',
    '--now',
    nowIso,
  ]);

  assert.equal(parsed.ok, false);
  assert.equal(parsed.report.remediation.totals.attempted, 0);
  assert.equal(parsed.report.remediation.unresolved.length, 1);
  assert.equal(parsed.report.remediation.unresolved[0].processId, 'tenant-missing-run-now');
  assert.equal(parsed.report.after.summary.escalations.critical > 0, true);

  fs.rmSync(tempRoot, { recursive: true, force: true });
});
