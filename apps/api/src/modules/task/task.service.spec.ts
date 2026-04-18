import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TaskService } from './task.service';

describe('TaskService legacy schema compatibility', () => {
  let db: any;
  let service: TaskService;

  beforeEach(() => {
    db = {
      tasks: {
        findTasksByStatusUnscoped: jest.fn(),
        findTasksByStatus: jest.fn(),
        updateTaskStatus: jest.fn(),
        createExecution: jest.fn(),
      },
      client: {
        execute: jest.fn(),
      },
    };
    service = new TaskService(db);
  });

  it('falls back to legacy task query when modern active task query fails', async () => {
    db.tasks.findTasksByStatusUnscoped.mockRejectedValue(new Error('column "data" does not exist'));
    db.client.execute.mockResolvedValue({
      rows: [
        {
          id: 'legacy_task_1',
          title: 'Legacy active task',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          type: 'HOSTMARIA_LEGACY_OPS',
          createdBy: 'user_1',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:10:00.000Z',
          metadata: { source: 'legacy' },
          tags: ['hostmaria'],
          dependencies: [],
        },
      ],
    });

    const tasks = await service.findActiveTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('legacy_task_1');
    expect((tasks[0] as any).userId).toBe('user_1');
    expect((tasks[0] as any).startTime).toBeInstanceOf(Date);
  });

  it('falls back to metadata log append when task_executions table is missing', async () => {
    db.tasks.createExecution.mockRejectedValue(
      new Error('relation "task_executions" does not exist')
    );
    db.client.execute
      .mockResolvedValueOnce({
        rows: [{ metadata: { executionLogs: [{ id: 'old_log' }] } }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const entry = await service.appendExecutionLog('task_1', {
      level: 'warn',
      message: 'legacy fallback log',
      actor: 'task-monitor',
      source: 'task-health-monitor',
      stage: 'scan',
      metadata: { autoFailed: false },
    });

    expect(entry.message).toBe('legacy fallback log');
    expect(db.client.execute).toHaveBeenCalledTimes(2);
  });

  it('falls back to legacy status update when modern update fails', async () => {
    db.tasks.updateTaskStatus.mockRejectedValue(new Error('column "end_time" does not exist'));
    db.client.execute.mockResolvedValue({
      rows: [
        {
          id: 'task_legacy',
          title: 'Legacy task',
          status: 'FAILED',
          priority: 'MEDIUM',
          type: 'HOSTMARIA_LEGACY_OPS',
          createdBy: 'user_1',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T01:00:00.000Z',
          completedAt: '2026-03-01T01:00:00.000Z',
          metadata: {},
          tags: [],
          dependencies: [],
          error: null,
        },
      ],
    });

    const updated = await service.updateTaskStatus('task_legacy', 'FAILED');

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('FAILED');
    expect((updated as any)?.userId).toBe('user_1');
  });
});
