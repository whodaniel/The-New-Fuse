import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  ChronologicalProcessesService,
  ProcessRunHistoryEntry,
} from './chronological-processes.service';

jest.mock('node:child_process', () => ({
  execFile: jest.fn(),
}));

type CronStateFile = {
  spec: string;
  updated_at: string;
  overrides: Record<string, unknown>;
  runtime: Record<string, unknown>;
  history: Record<string, ProcessRunHistoryEntry[]>;
  integrations?: Record<string, unknown>;
};

const mockedExecFile = execFile as unknown as jest.Mock;

const baseRegistry = {
  spec: 'tnf/cron-jobs-registry/0.1',
  generated_at: '2026-03-19T00:00:00.000Z',
  categories: [
    {
      category: 'observability',
      scope: 'tenant',
    },
    {
      category: 'tenant_agent_loop',
      scope: 'tenant',
    },
    {
      category: 'tenant_automation',
      scope: 'tenant',
    },
  ],
  jobs: [
    {
      schedule_id: 'tnf-terminal-awareness-reminder',
      scope: 'tenant',
      category: 'observability',
      owner_agent_id: 'tnf-super-admin',
      owner_user_id: 'super-admin',
      locked: false,
    },
    {
      schedule_id: 'tenant-personal-archaeology-master-loop',
      scope: 'tenant',
      category: 'tenant_agent_loop',
      owner_agent_id: 'personal-archaeology-master-orchestrator',
      owner_user_id: 'tenant-admin',
      locked: false,
    },
  ],
};

describe('ChronologicalProcessesService', () => {
  let tempRoot = '';
  let previousCwd = '';

  const statePath = () =>
    path.join(tempRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json');
  const catalogPath = () =>
    path.join(tempRoot, 'data', 'protocols', 'chronological-process-catalog.json');

  const writeJson = (filePath: string, payload: unknown) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  };

  beforeEach(() => {
    mockedExecFile.mockReset();
    previousCwd = process.cwd();
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-chronological-'));
    process.chdir(tempRoot);
    writeJson(path.join(tempRoot, 'data', 'protocols', 'cron-jobs.registry.json'), baseRegistry);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('projects nextRunAt for cron-backed schedules', async () => {
    const service = new ChronologicalProcessesService();
    const snapshot = await service.listProcesses();
    const process = snapshot.processes.find(
      (item) => item.id === 'tnf-terminal-awareness-reminder'
    );

    expect(process).toBeDefined();
    expect(process?.procedural.cadence).toBe('*/30 * * * *');
    expect(process?.procedural.nextRunAt).toEqual(expect.any(String));
    expect(process?.procedural.nextRunHint).toContain('Cron');
  });

  it('appends run history and keeps only the latest 25 entries', async () => {
    const oldHistory: ProcessRunHistoryEntry[] = Array.from({ length: 25 }, (_, index) => ({
      runId: `old-${index}`,
      processId: 'tnf-terminal-awareness-reminder',
      actorId: 'legacy-actor',
      startedAt: `2026-03-18T00:${String(index).padStart(2, '0')}:00.000Z`,
      finishedAt: `2026-03-18T00:${String(index).padStart(2, '0')}:30.000Z`,
      durationMs: 30000,
      status: 'healthy',
      exitCode: 0,
      error: null,
      outputPreview: 'legacy-output',
    }));

    const seededState: CronStateFile = {
      spec: 'tnf/cron-jobs-control-plane-state/0.1',
      updated_at: '2026-03-19T00:00:00.000Z',
      overrides: {},
      runtime: {},
      history: {
        'tnf-terminal-awareness-reminder': oldHistory,
      },
    };
    writeJson(statePath(), seededState);

    mockedExecFile.mockImplementation(
      (
        _command: string,
        _args: readonly string[],
        _options: object,
        callback: (error: Error | null, stdout: string, stderr: string) => void
      ) => {
        callback(null, '{"ok":true}', '');
        return {} as never;
      }
    );

    const service = new ChronologicalProcessesService();
    const result = await service.runProcessNow('tnf-terminal-awareness-reminder', {
      actorId: 'super-admin',
      actorRoles: ['SUPER_ADMIN'],
    });
    expect(result.run.status).toBe('healthy');

    const history = await service.getProcessHistory('tnf-terminal-awareness-reminder', 100);
    const runIds = history.runs.map((entry) => entry.runId);

    expect(history.total).toBe(25);
    expect(history.runs).toHaveLength(25);
    expect(runIds[0]).toMatch(/^run_/);
    expect(runIds).toContain('old-0');
    expect(runIds).not.toContain('old-24');

    const refreshedSnapshot = await service.listProcesses();
    const process = refreshedSnapshot.processes.find(
      (item) => item.id === 'tnf-terminal-awareness-reminder'
    );
    expect(process?.runtime.recentRuns?.[0]?.runId).toMatch(/^run_/);
  });

  it('registers archaeology processes with concrete run-now commands', async () => {
    const service = new ChronologicalProcessesService();
    const snapshot = await service.listProcesses();
    const process = snapshot.processes.find(
      (item) => item.id === 'tenant-personal-archaeology-master-loop'
    );

    expect(process).toBeDefined();
    expect(process?.procedural.cadence).toBe('*/30 * * * *');
    expect(process?.controls.canRunNow).toBe(true);
    expect(process?.procedural.runNowCommand).toEqual({
      command: 'node',
      args: ['scripts/timeline/personal-archaeology-orchestrator.mjs', 'master-loop'],
      timeoutMs: 30000,
    });
    expect(process?.docs.protocol).toBe(
      'docs/protocols/bridges/tnf-personal-archaeology-orchestration.yml'
    );
  });

  it('loads imported catalog entries from the shared chronological catalog file', async () => {
    writeJson(catalogPath(), {
      spec: 'tnf/chronological-process-catalog/0.1',
      generated_at: '2026-03-19T10:00:00.000Z',
      entries: {
        'tenant-daily-priority-plan': {
          title: 'Daily Priority Plan',
          cadence: '0 9 * * *',
          timezone: 'America/New_York',
          description: 'Imported legacy schedule',
          runNow: {
            command: 'node',
            args: [
              'scripts/protocols/chronological-dispatch.cjs',
              '--process-id',
              'tenant-daily-priority-plan',
            ],
            timeoutMs: 15000,
          },
          docs: {
            protocol: 'docs/protocols/bridges/tnf-openclaw-schedule-assimilation.yml',
          },
        },
      },
    });
    writeJson(path.join(tempRoot, 'data', 'protocols', 'cron-jobs.registry.json'), {
      ...baseRegistry,
      jobs: [
        ...baseRegistry.jobs,
        {
          schedule_id: 'tenant-daily-priority-plan',
          scope: 'tenant',
          category: 'tenant_automation',
          owner_agent_id: 'tnf-agent-director',
          owner_user_id: 'tenant-admin',
          locked: false,
        },
      ],
      categories: [
        ...baseRegistry.categories,
        {
          category: 'tenant_automation',
          scope: 'tenant',
        },
      ],
    });

    const service = new ChronologicalProcessesService();
    const snapshot = await service.listProcesses();
    const process = snapshot.processes.find((item) => item.id === 'tenant-daily-priority-plan');

    expect(process).toBeDefined();
    expect(process?.title).toBe('Daily Priority Plan');
    expect(process?.procedural.runNowCommand).toEqual({
      command: 'node',
      args: [
        'scripts/protocols/chronological-dispatch.cjs',
        '--process-id',
        'tenant-daily-priority-plan',
      ],
      timeoutMs: 15000,
    });
    expect(process?.docs.protocol).toBe(
      'docs/protocols/bridges/tnf-openclaw-schedule-assimilation.yml'
    );
  });

  it('surfaces synced OpenClaw runtime state for imported schedules', async () => {
    writeJson(catalogPath(), {
      spec: 'tnf/chronological-process-catalog/0.1',
      generated_at: '2026-03-19T10:00:00.000Z',
      entries: {
        'tenant-orchestrator-pulse': {
          title: 'Orchestrator Pulse',
          cadence: '*/30 * * * *',
          timezone: 'UTC',
          description: 'Imported legacy schedule',
          runNow: {
            command: 'node',
            args: [
              'scripts/protocols/chronological-dispatch.cjs',
              '--process-id',
              'tenant-orchestrator-pulse',
            ],
            timeoutMs: 15000,
          },
        },
      },
    });
    writeJson(path.join(tempRoot, 'data', 'protocols', 'cron-jobs.registry.json'), {
      ...baseRegistry,
      jobs: [
        ...baseRegistry.jobs,
        {
          schedule_id: 'tenant-orchestrator-pulse',
          scope: 'tenant',
          category: 'tenant_agent_loop',
          owner_agent_id: 'tnf-agent-director',
          owner_user_id: 'tenant-admin',
          locked: false,
        },
      ],
    });
    writeJson(statePath(), {
      spec: 'tnf/cron-jobs-control-plane-state/0.1',
      updated_at: '2026-03-19T12:00:00.000Z',
      overrides: {},
      runtime: {},
      history: {},
      integrations: {
        openclaw: {
          updatedAt: '2026-03-19T12:00:00.000Z',
          syncedBy: 'test-admin',
          summary: {
            installationCount: 1,
            instanceCount: 2,
            totalJobs: 3,
            enabledJobs: 1,
            disabledJobs: 2,
          },
          installations: {
            'local-openclaw-cli': {
              installationId: 'local-openclaw-cli',
              label: 'Local OpenClaw CLI',
            },
          },
          instances: {
            'local-openclaw-cli:main': {
              targetId: 'local-openclaw-cli:main',
              instanceId: 'main',
              instanceLabel: 'Main',
            },
            'local-openclaw-cli:dev': {
              targetId: 'local-openclaw-cli:dev',
              instanceId: 'dev',
              instanceLabel: 'Dev',
            },
          },
          mappedSchedules: {
            'tenant-orchestrator-pulse': {
              scheduleId: 'tenant-orchestrator-pulse',
              installationCount: 1,
              instanceCount: 2,
              jobCount: 1,
              duplicateCount: 0,
              enabledJobs: 1,
              disabledJobs: 0,
              anyEnabled: true,
              worstStatus: 'error',
              maxConsecutiveErrors: 2,
              nextRunAtMs: 1773958214564,
              liveJobs: [
                {
                  id: 'job-1',
                  name: 'TNF Orchestrator Pulse',
                  enabled: true,
                },
              ],
              instances: [
                {
                  targetId: 'local-openclaw-cli:main',
                  instanceId: 'main',
                  instanceLabel: 'Main',
                },
              ],
            },
          },
        },
      },
    });

    const service = new ChronologicalProcessesService();
    const snapshot = await service.listProcesses();
    const process = snapshot.processes.find((item) => item.id === 'tenant-orchestrator-pulse');

    expect(snapshot.summary.externalRuntimes).toEqual({
      openclaw: {
        updatedAt: '2026-03-19T12:00:00.000Z',
        syncedBy: 'test-admin',
        installationCount: 1,
        instanceCount: 2,
        totalJobs: 3,
        trackedSchedules: 1,
        duplicatedSchedules: 0,
        failingSchedules: 1,
      },
    });
    expect(process?.integrations.openclaw).toMatchObject({
      syncedBy: 'test-admin',
      installationCount: 1,
      totalInstanceCount: 2,
      jobCount: 1,
      worstStatus: 'error',
      maxConsecutiveErrors: 2,
    });
  });
});
