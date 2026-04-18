import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TaskService } from './task.service.js';

@Injectable()
export class TaskHealthMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskHealthMonitorService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly taskService: TaskService) {}

  onModuleInit(): void {
    const intervalMs = this.getIntervalMs();
    this.logger.log(`Task health monitor started (interval=${intervalMs}ms)`);

    // Run once on startup, then on interval.
    void this.scanForStuckTasks();
    this.timer = setInterval(() => {
      void this.scanForStuckTasks();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async scanForStuckTasks(): Promise<void> {
    try {
      const stuckTasks = await this.taskService.findStuckTasksUnscoped();
      if (stuckTasks.length === 0) {
        return;
      }

      const autoFail = process.env.TASK_STUCK_AUTO_FAIL === 'true';
      this.logger.warn(`Detected ${stuckTasks.length} stuck task(s)`);

      for (const task of stuckTasks) {
        await this.taskService.appendExecutionLog(task.id, {
          level: autoFail ? 'error' : 'warn',
          message: autoFail
            ? 'Task automatically marked failed after exceeding 30 minute runtime threshold'
            : 'Task exceeded 30 minute runtime threshold',
          actor: 'task-monitor',
          source: 'task-health-monitor',
          stage: 'stuck-task-scan',
          metadata: {
            taskId: task.id,
            startTime: task.startTime?.toISOString?.() ?? task.startTime,
            thresholdMinutes: 30,
            autoFailed: autoFail,
          },
        });

        if (autoFail) {
          await this.taskService.updateTaskStatus(task.id, 'FAILED');
        }
      }
    } catch (error) {
      this.logger.error('Task health monitor scan failed', error as Error);
    }
  }

  private getIntervalMs(): number {
    const fromEnv = Number(process.env.TASK_HEALTH_CHECK_INTERVAL_MS);
    if (Number.isFinite(fromEnv) && fromEnv >= 60_000) {
      return fromEnv;
    }

    // Default to 30 minutes.
    return 30 * 60 * 1000;
  }
}
