/**
 * Optional background worker that drains the Redis fair queue.
 * Enable with TNF_DURABLE_WORKER=1 (recommended on at least one API replica).
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DurableTasksFairQueue } from './durable-tasks.fair-queue';
import { DurableTasksService } from './durable-tasks.service';

@Injectable()
export class DurableTasksWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DurableTasksWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private busy = false;

  constructor(
    private readonly queue: DurableTasksFairQueue,
    private readonly durableTasks: DurableTasksService
  ) {}

  onModuleInit() {
    const enabled =
      process.env.TNF_DURABLE_WORKER === '1' || process.env.TNF_DURABLE_WORKER === 'true';
    if (!enabled) {
      this.logger.log('DurableTasks worker idle (set TNF_DURABLE_WORKER=1 to enable)');
      return;
    }
    const pollMs = Math.max(200, Number(process.env.TNF_DURABLE_WORKER_POLL_MS) || 1000);
    const batch = Math.max(1, Number(process.env.TNF_DURABLE_WORKER_BATCH) || 5);
    this.logger.log(`DurableTasks worker armed (poll=${pollMs}ms batch=${batch})`);
    this.timer = setInterval(() => {
      void this.tick(batch);
    }, pollMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(batch: number) {
    if (this.busy) return;
    this.busy = true;
    try {
      if (!(await this.queue.available())) return;
      for (let i = 0; i < batch; i++) {
        const job = await this.queue.claimNext();
        if (!job) break;
        try {
          await this.durableTasks.processClaimedJob(job.userId, job.runId);
        } catch (err) {
          this.logger.warn(
            `worker job ${job.runId} failed: ${err instanceof Error ? err.message : err}`
          );
          await this.queue.requeue(job.userId, job.runId);
        } finally {
          await this.queue.release(job.runId);
        }
      }
    } finally {
      this.busy = false;
    }
  }
}
