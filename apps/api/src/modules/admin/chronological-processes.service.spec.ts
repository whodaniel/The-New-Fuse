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
  ],
};

describe('ChronologicalProcessesService', () => {
  let tempRoot = '';
  let previousCwd = '';

  const statePath = () =>
    path.join(tempRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json');

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
});
