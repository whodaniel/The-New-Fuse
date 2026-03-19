const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  redactValue,
  runCli,
  getValueAtPath,
  readControlPlaneState,
} = require('./tnf-openclaw-control.cjs');

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

test('redactValue redacts nested secret-bearing keys', () => {
  const input = {
    gateway: {
      auth: {
        token: 'abc123',
        mode: 'bearer',
      },
    },
    channels: {
      whatsapp: {
        allowFrom: ['+15555550123'],
      },
    },
  };

  const redacted = redactValue(input);
  assert.equal(redacted.gateway.auth.token, '[REDACTED]');
  assert.equal(redacted.gateway.auth.mode, 'bearer');
  assert.deepEqual(redacted.channels.whatsapp.allowFrom, ['+15555550123']);
});

test('runCli overview maps OpenClaw cron jobs to TNF schedule ids', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-openclaw-overview-'));
  const stateDir = path.join(tempRoot, 'state');
  const configPath = path.join(stateDir, 'openclaw.json');
  const cronPath = path.join(stateDir, 'cron', 'jobs.json');
  const repoRoot = path.join(tempRoot, 'repo');

  writeJson(configPath, {
    channels: { whatsapp: { allowFrom: ['+15555550123'] } },
    gateway: { auth: { token: 'secret-token', mode: 'bearer' } },
  });
  writeJson(cronPath, {
    version: 1,
    jobs: [
      {
        id: 'job-1',
        name: 'TNF Daily Priority Plan',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 9 * * *', tz: 'America/New_York' },
        state: { lastStatus: 'ok', nextRunAtMs: 1774011600000 },
      },
    ],
  });
  writeJson(path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tenant-daily-priority-plan': {
        title: 'Daily Priority Plan',
        metadata: {
          legacySource: {
            system: 'openclaw',
            jobName: 'TNF Daily Priority Plan',
          },
        },
      },
    },
  });

  const result = runCli([
    'overview',
    '--json',
    '--state-dir',
    stateDir,
    '--repo-root',
    repoRoot,
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.targets[0].overview.cron.jobs[0].tnfScheduleId, 'tenant-daily-priority-plan');
  assert.equal(result.targets[0].overview.config.redacted.gateway.auth.token, '[REDACTED]');

  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('runCli can set and unset OpenClaw config paths and mutate cron enablement', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-openclaw-mutate-'));
  const stateDir = path.join(tempRoot, 'state');
  const configPath = path.join(stateDir, 'openclaw.json');
  const cronPath = path.join(stateDir, 'cron', 'jobs.json');

  writeJson(configPath, {
    channels: { whatsapp: { allowFrom: ['+15555550123'] } },
  });
  writeJson(cronPath, {
    version: 1,
    jobs: [
      {
        id: 'job-1',
        name: 'TNF Daily Priority Plan',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 9 * * *' },
      },
    ],
  });

  runCli(['config-set', 'gateway.auth.mode', 'bearer', '--state-dir', stateDir]);
  const updatedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.equal(getValueAtPath(updatedConfig, 'gateway.auth.mode'), 'bearer');

  runCli(['config-unset', 'gateway.auth.mode', '--state-dir', stateDir]);
  const unsetConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.equal(getValueAtPath(unsetConfig, 'gateway.auth.mode'), undefined);

  runCli(['cron-disable', 'TNF Daily Priority Plan', '--state-dir', stateDir]);
  let cron = JSON.parse(fs.readFileSync(cronPath, 'utf8'));
  assert.equal(cron.jobs[0].enabled, false);

  runCli(['cron-schedule', 'TNF Daily Priority Plan', '--cron', '0 * * * *', '--state-dir', stateDir]);
  cron = JSON.parse(fs.readFileSync(cronPath, 'utf8'));
  assert.equal(cron.jobs[0].schedule.expr, '0 * * * *');

  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('runCli sync-control-plane writes OpenClaw integration state into TNF control-plane records', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-openclaw-sync-'));
  const stateDir = path.join(tempRoot, 'state');
  const configPath = path.join(stateDir, 'openclaw.json');
  const cronPath = path.join(stateDir, 'cron', 'jobs.json');
  const repoRoot = path.join(tempRoot, 'repo');

  writeJson(configPath, {
    channels: { whatsapp: { allowFrom: ['+15555550123'] } },
    gateway: { auth: { token: 'secret-token', mode: 'bearer' } },
  });
  writeJson(cronPath, {
    version: 1,
    jobs: [
      {
        id: 'job-1',
        name: 'TNF Daily Priority Plan',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 9 * * *', tz: 'America/New_York' },
        state: { lastStatus: 'ok', nextRunAtMs: 1774011600000, consecutiveErrors: 0 },
      },
    ],
  });
  writeJson(path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tenant-daily-priority-plan': {
        title: 'Daily Priority Plan',
        metadata: {
          legacySource: {
            system: 'openclaw',
            jobName: 'TNF Daily Priority Plan',
          },
        },
      },
    },
  });

  const result = runCli([
    'sync-control-plane',
    '--json',
    '--actor',
    'test-admin',
    '--state-dir',
    stateDir,
    '--repo-root',
    repoRoot,
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.syncedBy, 'test-admin');
  assert.equal(result.snapshot.summary.instanceCount, 1);
  assert.equal(
    result.snapshot.mappedSchedules['tenant-daily-priority-plan'].liveJobs[0].tnfScheduleId,
    'tenant-daily-priority-plan'
  );

  const state = readControlPlaneState(repoRoot);
  assert.equal(state.integrations.openclaw.syncedBy, 'test-admin');
  assert.equal(
    state.integrations.openclaw.mappedSchedules['tenant-daily-priority-plan'].jobCount,
    1
  );

  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('runCli cleanup-cron prunes duplicate launch validation jobs and disables failing TNF-managed jobs', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-openclaw-cleanup-'));
  const stateDir = path.join(tempRoot, 'state');
  const configPath = path.join(stateDir, 'openclaw.json');
  const cronPath = path.join(stateDir, 'cron', 'jobs.json');
  const repoRoot = path.join(tempRoot, 'repo');

  writeJson(configPath, {
    channels: { whatsapp: { allowFrom: ['+15555550123'] } },
  });
  writeJson(cronPath, {
    version: 1,
    jobs: [
      {
        id: 'launch-1',
        name: 'TNF Launch Validation',
        enabled: false,
        schedule: { kind: 'at', at: '2026-03-05T10:30:00.000Z' },
        state: { lastStatus: 'error' },
      },
      {
        id: 'launch-2',
        name: 'TNF Launch Validation',
        enabled: false,
        schedule: { kind: 'at', at: '2026-03-05T10:30:00.000Z' },
        state: { lastStatus: 'error' },
      },
      {
        id: 'pulse-1',
        name: 'TNF Orchestrator Pulse',
        enabled: true,
        schedule: { kind: 'every', everyMs: 1800000, anchorMs: 1772528475514 },
        state: { lastStatus: 'error', consecutiveErrors: 3 },
      },
    ],
  });
  writeJson(path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tenant-launch-validation': {
        title: 'Launch Validation',
        metadata: {
          legacySource: {
            system: 'openclaw',
            jobName: 'TNF Launch Validation',
          },
        },
      },
      'tenant-orchestrator-pulse': {
        title: 'Orchestrator Pulse',
        metadata: {
          legacySource: {
            system: 'openclaw',
            jobName: 'TNF Orchestrator Pulse',
          },
        },
      },
    },
  });

  const result = runCli([
    'cleanup-cron',
    '--json',
    '--actor',
    'cleanup-admin',
    '--disable-failing',
    '--state-dir',
    stateDir,
    '--repo-root',
    repoRoot,
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  assert.equal(result.targets[0].cleanup.removedJobs.length, 1);
  assert.equal(result.targets[0].cleanup.disabledJobs.length, 1);
  assert.match(result.targets[0].cleanup.backupPath, /jobs\.json\.bak\./);

  const cron = JSON.parse(fs.readFileSync(cronPath, 'utf8'));
  assert.equal(cron.jobs.length, 2);
  assert.equal(cron.jobs.find((job) => job.id === 'pulse-1').enabled, false);

  const state = readControlPlaneState(repoRoot);
  const targetIds = Object.keys(state.integrations.openclaw.instances || {});
  assert.equal(targetIds.length, 1);
  assert.equal(state.integrations.openclaw.instances[targetIds[0]].cleanup.actor, 'cleanup-admin');
  assert.equal(
    state.integrations.openclaw.mappedSchedules['tenant-launch-validation'].jobCount,
    1
  );

  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('runCli sync-control-plane preserves null nextRunAtMs for disabled jobs', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-openclaw-null-next-run-'));
  const stateDir = path.join(tempRoot, 'state');
  const configPath = path.join(stateDir, 'openclaw.json');
  const cronPath = path.join(stateDir, 'cron', 'jobs.json');
  const repoRoot = path.join(tempRoot, 'repo');

  writeJson(configPath, {
    channels: { whatsapp: { allowFrom: ['+15555550123'] } },
  });
  writeJson(cronPath, {
    version: 1,
    jobs: [
      {
        id: 'watchdog-1',
        name: 'TNF Loop Watchdog',
        enabled: false,
        schedule: { kind: 'every', everyMs: 900000, anchorMs: 1772529273781 },
        state: { lastStatus: 'ok', nextRunAtMs: null, consecutiveErrors: 0 },
      },
    ],
  });
  writeJson(path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tenant-loop-watchdog': {
        title: 'Loop Watchdog',
        metadata: {
          legacySource: {
            system: 'openclaw',
            jobName: 'TNF Loop Watchdog',
          },
        },
      },
    },
  });

  const result = runCli([
    'sync-control-plane',
    '--json',
    '--actor',
    'test-admin',
    '--state-dir',
    stateDir,
    '--repo-root',
    repoRoot,
  ]);

  assert.equal(result.snapshot.mappedSchedules['tenant-loop-watchdog'].nextRunAtMs, null);

  const state = readControlPlaneState(repoRoot);
  assert.equal(state.integrations.openclaw.mappedSchedules['tenant-loop-watchdog'].nextRunAtMs, null);

  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test('runCli instances and sync-control-plane support multiple instances across an installation', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-openclaw-instances-'));
  const repoRoot = path.join(tempRoot, 'repo');
  const mainStateDir = path.join(tempRoot, 'instances', 'main');
  const devStateDir = path.join(tempRoot, 'instances', 'dev');

  writeJson(path.join(mainStateDir, 'openclaw.json'), {
    gateway: { mode: 'main' },
  });
  writeJson(path.join(mainStateDir, 'cron', 'jobs.json'), {
    version: 1,
    jobs: [
      {
        id: 'main-job-1',
        name: 'TNF Orchestrator Pulse',
        enabled: true,
        schedule: { kind: 'every', everyMs: 1800000, anchorMs: 1772528475514 },
        state: { lastStatus: 'ok', nextRunAtMs: 1773958214564, consecutiveErrors: 0 },
      },
    ],
  });
  writeJson(path.join(devStateDir, 'openclaw.json'), {
    gateway: { mode: 'dev' },
  });
  writeJson(path.join(devStateDir, 'cron', 'jobs.json'), {
    version: 1,
    jobs: [
      {
        id: 'dev-job-1',
        name: 'TNF Orchestrator Pulse',
        enabled: false,
        schedule: { kind: 'every', everyMs: 1800000, anchorMs: 1772528475514 },
        state: { lastStatus: 'error', nextRunAtMs: null, consecutiveErrors: 2 },
      },
    ],
  });
  writeJson(path.join(repoRoot, 'data', 'protocols', 'openclaw-installations.registry.json'), {
    spec: 'tnf/openclaw-installations-registry/0.1',
    installations: {
      'local-openclaw-cli': {
        label: 'Local OpenClaw CLI',
        transport: 'local_filesystem',
        binaryPath: 'openclaw',
        host: 'localhost',
        discovery: {
          includeHomeProfiles: false,
        },
        instances: {
          main: {
            label: 'Main',
            profile: 'main',
            stateDir: mainStateDir,
            default: true,
          },
          dev: {
            label: 'Dev',
            profile: 'dev',
            stateDir: devStateDir,
          },
        },
      },
    },
  });
  writeJson(path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json'), {
    spec: 'tnf/chronological-process-catalog/0.1',
    entries: {
      'tenant-orchestrator-pulse': {
        title: 'Orchestrator Pulse',
        metadata: {
          legacySource: {
            system: 'openclaw',
            jobName: 'TNF Orchestrator Pulse',
          },
        },
      },
    },
  });

  const instancesResult = runCli(['instances', '--json', '--repo-root', repoRoot]);
  assert.equal(instancesResult.instances.length, 2);
  assert.deepEqual(
    instancesResult.instances.map((entry) => entry.targetId),
    ['local-openclaw-cli:dev', 'local-openclaw-cli:main']
  );

  const syncResult = runCli([
    'sync-control-plane',
    '--json',
    '--actor',
    'multi-admin',
    '--all-instances',
    '--repo-root',
    repoRoot,
  ]);
  assert.equal(syncResult.snapshot.summary.instanceCount, 2);
  assert.equal(
    syncResult.snapshot.mappedSchedules['tenant-orchestrator-pulse'].instanceCount,
    2
  );
  assert.equal(
    syncResult.snapshot.mappedSchedules['tenant-orchestrator-pulse'].enabledJobs,
    1
  );
  assert.equal(
    syncResult.snapshot.mappedSchedules['tenant-orchestrator-pulse'].disabledJobs,
    1
  );

  fs.rmSync(tempRoot, { recursive: true, force: true });
});
