import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { DurableTasksCostAuthority } from './durable-tasks.cost-authority';
import { DurableTasksFairQueue } from './durable-tasks.fair-queue';
import { PgDurableTaskStore } from './durable-tasks.pg-store';
import {
  CloudDurableTaskStore,
  type DurableMachine,
  type DurableRun,
  type DurableSchedule,
  type DurableTaskDef,
} from './durable-tasks.store';

type Backend = 'postgres' | 'file';

@Injectable()
export class DurableTasksService {
  private readonly logger = new Logger(DurableTasksService.name);
  private backend: Backend | null = null;

  constructor(
    private readonly costAuthority: DurableTasksCostAuthority,
    private readonly fairQueue: DurableTasksFairQueue,
    @Optional() private readonly db?: DatabaseService
  ) {}

  private preferPostgres(): boolean {
    if (process.env.TNF_DURABLE_STORE === 'file') return false;
    if (process.env.TNF_DURABLE_STORE === 'postgres') return true;
    return Boolean(process.env.DATABASE_URL || process.env.MARKETPLACE_DATABASE_URL);
  }

  private async resolveBackend(): Promise<Backend> {
    if (this.backend) return this.backend;
    if (this.preferPostgres() && this.db) {
      try {
        await this.db.healthCheck();
        this.backend = 'postgres';
        this.logger.log('DurableTasks backend: postgres');
        return this.backend;
      } catch (err) {
        this.logger.warn(
          `Postgres unavailable for DurableTasks — falling back to file store (${
            err instanceof Error ? err.message : err
          })`
        );
      }
    }
    this.backend = 'file';
    this.logger.log('DurableTasks backend: file');
    return this.backend;
  }

  private fileStore(userId: string): CloudDurableTaskStore {
    return new CloudDurableTaskStore(userId);
  }

  private pgStore(userId: string): PgDurableTaskStore {
    if (!this.db) throw new ServiceUnavailableException('DatabaseService not available');
    return new PgDurableTaskStore(this.db, userId);
  }

  async bootstrap(userId: string): Promise<DurableTaskDef[]> {
    if ((await this.resolveBackend()) === 'postgres') {
      return this.pgStore(userId).ensureBootstrapTasks();
    }
    return this.fileStore(userId).ensureBootstrapTasks();
  }

  async listTasks(userId: string): Promise<DurableTaskDef[]> {
    if ((await this.resolveBackend()) === 'postgres') {
      const store = this.pgStore(userId);
      const tasks = await store.listTasks();
      if (tasks.length === 0) return store.ensureBootstrapTasks();
      return tasks;
    }
    const store = this.fileStore(userId);
    const tasks = store.listTasks();
    if (tasks.length === 0) return store.ensureBootstrapTasks();
    return tasks;
  }

  async defineTask(
    userId: string,
    body: {
      id: string;
      handler?: string;
      description?: string;
      queueName?: string;
      concurrencyLimit?: number;
      machine?: DurableMachine;
    }
  ): Promise<DurableTaskDef> {
    try {
      if ((await this.resolveBackend()) === 'postgres') {
        return await this.pgStore(userId).defineTask(body);
      }
      return this.fileStore(userId).defineTask(body);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : String(err));
    }
  }

  async authorizeTrigger(userId: string, taskId: string) {
    const auth = await this.costAuthority.authorizeBeforeEnqueue(
      {
        tenantId: userId,
        workspaceId: userId,
        userId,
        capability: 'durable-tasks.trigger',
        entitlementTier: 'starter+',
        fundingTier: 'shared-free',
        idempotencyKey: `trigger:${userId}:${taskId}:${Date.now()}`,
        requestedAt: new Date().toISOString(),
        requirements: { durable: true },
      },
      [
        {
          provider: 'local',
          route: 'tnf-durable-tasks',
          estimatedCostUsd: this.costAuthority.unitUsd(),
          durable: true,
          isolation: 'tenant',
        },
      ]
    );
    if (auth.decision === 'deny' || auth.decision === 'defer') {
      throw new ServiceUnavailableException(auth.reason);
    }
    return auth;
  }

  async trigger(
    userId: string,
    taskId: string,
    payload: Record<string, unknown> = {},
    projectId?: string
  ) {
    const auth = await this.authorizeTrigger(userId, taskId);
    try {
      let result: { run: DurableRun; publicRunToken: string };
      if ((await this.resolveBackend()) === 'postgres') {
        result = await this.pgStore(userId).trigger(
          taskId,
          payload,
          { userId, projectId },
          auth.authorizationId
        );
      } else {
        result = this.fileStore(userId).trigger(taskId, payload, { userId, projectId });
      }
      await this.fairQueue.enqueue(userId, result.run.id);
      return { ...result, authorization: auth };
    } catch (err) {
      throw new NotFoundException(err instanceof Error ? err.message : String(err));
    }
  }

  async listRuns(
    userId: string,
    filter: { taskId?: string; status?: string } = {}
  ): Promise<DurableRun[]> {
    if ((await this.resolveBackend()) === 'postgres') {
      return this.pgStore(userId).listRuns(filter);
    }
    return this.fileStore(userId).listRuns(filter);
  }

  async getRun(userId: string, runId: string): Promise<DurableRun> {
    const run =
      (await this.resolveBackend()) === 'postgres'
        ? await this.pgStore(userId).getRun(runId)
        : this.fileStore(userId).getRun(runId);
    if (!run) throw new NotFoundException(`Unknown run: ${runId}`);
    return run;
  }

  async cancelRun(userId: string, runId: string): Promise<DurableRun> {
    try {
      if ((await this.resolveBackend()) === 'postgres') {
        return await this.pgStore(userId).cancelRun(runId);
      }
      return this.fileStore(userId).cancelRun(runId);
    } catch (err) {
      throw new NotFoundException(err instanceof Error ? err.message : String(err));
    }
  }

  async replayRun(userId: string, runId: string) {
    const prior = await this.getRun(userId, runId);
    const auth = await this.authorizeTrigger(userId, prior.taskId);
    try {
      let result: { run: DurableRun; publicRunToken: string };
      if ((await this.resolveBackend()) === 'postgres') {
        result = await this.pgStore(userId).replayRun(runId, auth.authorizationId);
      } else {
        result = this.fileStore(userId).replayRun(runId);
      }
      await this.fairQueue.enqueue(userId, result.run.id);
      return { ...result, authorization: auth };
    } catch (err) {
      throw new NotFoundException(err instanceof Error ? err.message : String(err));
    }
  }

  async listEvents(userId: string, runId: string, since = 0) {
    await this.getRun(userId, runId);
    if ((await this.resolveBackend()) === 'postgres') {
      return this.pgStore(userId).listRunEvents(runId, since);
    }
    return this.fileStore(userId).listRunEvents(runId, since);
  }

  async listSchedules(userId: string): Promise<DurableSchedule[]> {
    if ((await this.resolveBackend()) === 'postgres') {
      return this.pgStore(userId).listSchedules();
    }
    return this.fileStore(userId).listSchedules();
  }

  async addSchedule(
    userId: string,
    body: {
      id: string;
      taskId: string;
      everyMs: number;
      payload?: Record<string, unknown>;
      enabled?: boolean;
    }
  ): Promise<DurableSchedule> {
    try {
      if ((await this.resolveBackend()) === 'postgres') {
        return await this.pgStore(userId).addSchedule(body);
      }
      return this.fileStore(userId).addSchedule(body);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : String(err));
    }
  }

  async setScheduleEnabled(userId: string, id: string, enabled: boolean): Promise<DurableSchedule> {
    try {
      if ((await this.resolveBackend()) === 'postgres') {
        return await this.pgStore(userId).setScheduleEnabled(id, enabled);
      }
      return this.fileStore(userId).setScheduleEnabled(id, enabled);
    } catch (err) {
      throw new NotFoundException(err instanceof Error ? err.message : String(err));
    }
  }

  async tickUser(userId: string, runId?: string): Promise<boolean> {
    if ((await this.resolveBackend()) === 'postgres') {
      const completed = await this.pgStore(userId).tickOnce(runId);
      if (completed && (completed.status === 'COMPLETED' || completed.status === 'FAILED')) {
        await this.recordRunUsage(userId, completed);
      } else if (completed && completed.status === 'QUEUED') {
        // Retry path — put back on fair queue for another attempt
        await this.fairQueue.enqueue(userId, completed.id);
      }
      return Boolean(completed);
    }
    const store = this.fileStore(userId);
    const targetId = runId || store.listRuns({ status: 'QUEUED' })[0]?.id;
    const advanced = await store.tickOnce(runId);
    if (advanced && targetId) {
      const done = store.getRun(targetId);
      if (done && (done.status === 'COMPLETED' || done.status === 'FAILED')) {
        await this.recordRunUsage(userId, done);
      } else if (done && done.status === 'QUEUED') {
        await this.fairQueue.enqueue(userId, done.id);
      }
    }
    return advanced;
  }

  /** Worker entry: execute a fair-queue claimed run. */
  async processClaimedJob(userId: string, runId: string): Promise<void> {
    await this.tickUser(userId, runId);
  }

  async drain(userId: string, max = 20): Promise<number> {
    let n = 0;
    // Prefer claimed fair-queue jobs for this user when Redis is up.
    if (await this.fairQueue.available()) {
      for (let i = 0; i < max; i++) {
        const job = await this.fairQueue.claimNext();
        if (!job) break;
        if (job.userId !== userId) {
          // Not ours — requeue and stop preferring queue for this request drain
          await this.fairQueue.requeue(job.userId, job.runId);
          break;
        }
        try {
          await this.processClaimedJob(job.userId, job.runId);
          n += 1;
        } finally {
          await this.fairQueue.release(job.runId);
        }
      }
    }
    // Always finish any local queued runs for this user (schedules / file fallback).
    for (let i = n; i < max; i++) {
      const advanced = await this.tickUser(userId);
      if (!advanced) break;
      n += 1;
    }
    return n;
  }

  /** Cross-tenant fair drain (admin/worker). */
  async drainFair(max = 20): Promise<number> {
    let n = 0;
    if (!(await this.fairQueue.available())) return 0;
    for (let i = 0; i < max; i++) {
      const job = await this.fairQueue.claimNext();
      if (!job) break;
      try {
        await this.processClaimedJob(job.userId, job.runId);
        n += 1;
      } finally {
        await this.fairQueue.release(job.runId);
      }
    }
    return n;
  }

  private async recordRunUsage(userId: string, run: DurableRun): Promise<void> {
    try {
      await this.costAuthority.recordUsage({
        authorizationId: `post:${run.id}`,
        tenantId: userId,
        workspaceId: userId,
        capability: 'durable-tasks.run',
        provider: 'local',
        route: 'tnf-durable-tasks',
        providerOperationId: run.id,
        idempotencyKey: `usage:${run.id}`,
        estimatedCostUsd: (run.estimatedCostUnits || 0) * this.costAuthority.unitUsd(),
        actualCostUsd: (run.estimatedCostUnits || 0) * this.costAuthority.unitUsd(),
        meteredUnits: {
          invocations: 1,
          costUnits: run.estimatedCostUnits || 0,
        },
        startedAt: run.startedAt || run.createdAt,
        completedAt: run.completedAt || new Date().toISOString(),
        outcome:
          run.status === 'COMPLETED'
            ? 'succeeded'
            : run.status === 'CANCELLED'
              ? 'cancelled'
              : 'failed',
        metadata: {
          taskId: run.taskId,
          machine: run.machine,
          durationMs: run.durationMs,
        },
      });
    } catch (err) {
      this.logger.warn(`usage record skipped: ${err instanceof Error ? err.message : err}`);
    }
  }

  async usageSummary(userId: string) {
    const spent = await this.costAuthority.monthSpentUnits(userId);
    const free = this.costAuthority.freeUnitsMonth();
    const queue = await this.fairQueue.stats();
    return {
      backend: await this.resolveBackend(),
      monthCostUnits: spent,
      freeUnitsMonth: free,
      remainingFreeUnits: Math.max(0, free - spent),
      unitUsd: this.costAuthority.unitUsd(),
      enforce: this.costAuthority.enforce(),
      queue,
      workerEnabled:
        process.env.TNF_DURABLE_WORKER === '1' || process.env.TNF_DURABLE_WORKER === 'true',
    };
  }
}
