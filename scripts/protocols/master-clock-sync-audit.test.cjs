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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-master-clock-sync-'));
  const protocolsDir = path.join(tempRoot, 'data', 'protocols');
  fs.mkdirSync(protocolsDir, { recursive: true });
  return { tempRoot, protocolsDir };
}

function runAudit(scriptPath, args) {
  const stdout = execFileSync('node', [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(stdout);
}

test('master-clock-sync-audit passes healthy scheduled process without escalation', () => {
  const { tempRoot, protocolsDir } = bootstrapTempRepo();
  const nowIso = '2026-03-26T12:00:00.000Z';

  writeJson(path.join(protocolsDir, 'cron-jobs.registry.json'), {
    spec: 'tnf/cron-jobs-registry/0.1',
    jobs: [
      {
        schedule_id: 'tenant-healthy-loop',
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
      'tenant-healthy-loop': {
        title: 'Tenant Healthy Loop',
        cadence: '*/15 * * * *',
        timezone: 'UTC',
        description: 'Healthy test loop',
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
      'tenant-healthy-loop': {
        status: 'healthy',
        lastRunAt: '2026-03-26T11:50:00.000Z',
        lastDurationMs: 1200,
        lastExitCode: 0,
        lastError: null,
      },
    },
    history: {
      'tenant-healthy-loop': [
        {
          runId: 'run_1',
          processId: 'tenant-healthy-loop',
          actorId: 'tnf-master-clock',
          startedAt: '2026-03-26T11:49:58.000Z',
          finishedAt: '2026-03-26T11:50:00.000Z',
          durationMs: 2000,
          status: 'healthy',
          exitCode: 0,
          error: null,
          outputPreview: 'ok',
        },
      ],
    },
  });

  const scriptPath = path.join(
    process.cwd(),
    'scripts',
    'protocols',
    'master-clock-sync-audit.cjs'
  );

  const parsed = runAudit(scriptPath, [
    '--repo-root',
    tempRoot,
    '--json',
    '--no-write-report',
    '--now',
    nowIso,
  ]);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.report.summary.escalations.total, 0);
  assert.equal(parsed.report.processes.length, 1);
  assert.equal(parsed.report.processes[0].processId, 'tenant-healthy-loop');
  assert.equal(parsed.report.processes[0].output.escalationSignal, null);

  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('master-clock-sync-audit flags critical escalation for stale/failing process and stale lock', () => {
  const { tempRoot, protocolsDir } = bootstrapTempRepo();
  const nowIso = '2026-03-26T12:00:00.000Z';

  writeJson(path.join(protocolsDir, 'cron-jobs.registry.json'), {
    spec: 'tnf/cron-jobs-registry/0.1',
    jobs: [
      {
        schedule_id: 'tnf-critical-loop',
        scope: 'system_framework',
        category: 'orchestration_gate',
        owner_agent_id: 'master-clock',
        owner_user_id: 'super-admin',
        locked: true,
      },
    ],
  });

  writeJson(path.join(protocolsDir, 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tnf-critical-loop': {
        title: 'Critical Loop',
        cadence: '*/15 * * * *',
        timezone: 'UTC',
        description: 'Critical loop',
        runNow: {
          command: 'node',
          args: ['scripts/protocols/chronological-dispatch.cjs', '--process-id', 'tnf-critical-loop'],
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
      'tnf-critical-loop': {
        status: 'error',
        lastRunAt: '2026-03-26T10:00:00.000Z',
        lastDurationMs: 10000,
        lastExitCode: 1,
        lastError: 'dispatch failed',
      },
    },
    history: {
      'tnf-critical-loop': [
        {
          runId: 'run_2',
          processId: 'tnf-critical-loop',
          actorId: 'tnf-master-clock',
          startedAt: '2026-03-26T09:59:50.000Z',
          finishedAt: '2026-03-26T10:00:00.000Z',
          durationMs: 10000,
          status: 'error',
          exitCode: 1,
          error: 'dispatch failed',
          outputPreview: 'failed',
        },
        {
          runId: 'run_1',
          processId: 'tnf-critical-loop',
          actorId: 'tnf-master-clock',
          startedAt: '2026-03-26T09:45:50.000Z',
          finishedAt: '2026-03-26T09:46:00.000Z',
          durationMs: 10000,
          status: 'error',
          exitCode: 1,
          error: 'dispatch failed',
          outputPreview: 'failed',
        },
      ],
    },
  });

  writeJson(path.join(protocolsDir, 'cron-job-locks', 'tnf-critical-loop.lock.json'), {
    processId: 'tnf-critical-loop',
    actorId: 'tnf-master-clock',
    startedAt: '2026-03-26T11:30:00.000Z',
    pid: 999,
  });

  const scriptPath = path.join(
    process.cwd(),
    'scripts',
    'protocols',
    'master-clock-sync-audit.cjs'
  );

  const parsed = runAudit(scriptPath, [
    '--repo-root',
    tempRoot,
    '--json',
    '--no-write-report',
    '--warn-only',
    '--now',
    nowIso,
  ]);

  assert.equal(parsed.ok, false);
  assert.equal(parsed.report.summary.escalations.critical > 0, true);
  assert.equal(parsed.report.processes.length, 1);
  assert.equal(parsed.report.processes[0].processId, 'tnf-critical-loop');
  assert.equal(parsed.report.processes[0].output.escalationSignal.severity, 'critical');

  fs.rmSync(tempRoot, { recursive: true, force: true });
});
