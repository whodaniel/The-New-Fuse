/**
 * Postgres-backed DurableTask store (multi-tenant SaaS).
 * Falls back is handled by DurableTasksService when DB is unavailable.
 */
import type { DatabaseService } from '@the-new-fuse/database';
import {
  durableRunEvents,
  durableRuns,
  durableSchedules,
  durableTasks,
} from '@the-new-fuse/database';
import { and, asc, desc, eq, gt, sql } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import {
  machineCostPerSecond,
  type DurableMachine,
  type DurableRun,
  type DurableRunEvent,
  type DurableSchedule,
  type DurableTaskDef,
} from './durable-tasks.store';

const DEFAULT_MAX_ATTEMPTS = 3;

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function toTaskDef(row: typeof durableTasks.$inferSelect): DurableTaskDef {
  return {
    id: row.id,
    version: row.version,
    handler: row.handler,
    description: row.description || undefined,
    queue: { name: row.queueName, concurrencyLimit: row.concurrencyLimit },
    machine: (row.machine as DurableMachine) || 'small',
    deployedVersion: row.deployedVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toRun(row: typeof durableRuns.$inferSelect): DurableRun {
  return {
    id: row.id,
    taskId: row.taskId,
    taskVersion: row.taskVersion,
    status: row.status as DurableRun['status'],
    payload: (row.payload as Record<string, unknown>) || {},
    attempt: row.attempt,
    ownership: (row.ownership as DurableRun['ownership']) || {},
    result: row.result ?? undefined,
    error: row.error || undefined,
    publicTokenHash: row.publicTokenHash || undefined,
    machine: (row.machine as DurableMachine) || 'small',
    startedAt: row.startedAt?.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    durationMs: row.durationMs ?? undefined,
    estimatedCostUnits: row.estimatedCostUnits ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSchedule(row: typeof durableSchedules.$inferSelect): DurableSchedule {
  return {
    id: row.id,
    taskId: row.taskId,
    everyMs: row.everyMs,
    payload: (row.payload as Record<string, unknown>) || undefined,
    enabled: row.enabled,
    lastFiredAt: row.lastFiredAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export class PgDurableTaskStore {
  constructor(
    private readonly db: DatabaseService,
    private readonly ownerUserId: string
  ) {}

  private client() {
    return this.db.client;
  }

  async defineTask(input: {
    id: string;
    handler?: string;
    description?: string;
    queueName?: string;
    concurrencyLimit?: number;
    machine?: DurableMachine;
  }): Promise<DurableTaskDef> {
    const id = String(input.id || '').trim();
    if (!id) throw new Error('task id required');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id)) {
      throw new Error('task id must be alphanumeric with ._-:');
    }
    const existing = await this.getTask(id);
    const version = existing ? existing.version + 1 : 1;
    const now = new Date();
    const row = {
      id,
      ownerUserId: this.ownerUserId,
      version,
      handler: input.handler || existing?.handler || 'echo',
      description: input.description ?? existing?.description ?? null,
      queueName: input.queueName || existing?.queue.name || 'default',
      concurrencyLimit: input.concurrencyLimit ?? existing?.queue.concurrencyLimit ?? 5,
      machine: input.machine || existing?.machine || 'small',
      deployedVersion: existing?.deployedVersion ?? version,
      createdAt: existing ? new Date(existing.createdAt) : now,
      updatedAt: now,
    };
    await this.client()
      .insert(durableTasks)
      .values(row)
      .onConflictDoUpdate({
        target: [durableTasks.ownerUserId, durableTasks.id],
        set: {
          version: row.version,
          handler: row.handler,
          description: row.description,
          queueName: row.queueName,
          concurrencyLimit: row.concurrencyLimit,
          machine: row.machine,
          deployedVersion: row.deployedVersion,
          updatedAt: row.updatedAt,
        },
      });
    await this.appendEvent({ runId: '', type: 'task.defined', data: { taskId: id, version } });
    return (await this.getTask(id))!;
  }

  async listTasks(): Promise<DurableTaskDef[]> {
    const rows = await this.client()
      .select()
      .from(durableTasks)
      .where(eq(durableTasks.ownerUserId, this.ownerUserId))
      .orderBy(asc(durableTasks.id));
    return rows.map(toTaskDef);
  }

  async getTask(id: string): Promise<DurableTaskDef | undefined> {
    const rows = await this.client()
      .select()
      .from(durableTasks)
      .where(and(eq(durableTasks.ownerUserId, this.ownerUserId), eq(durableTasks.id, id)))
      .limit(1);
    return rows[0] ? toTaskDef(rows[0]) : undefined;
  }

  async ensureBootstrapTasks(): Promise<DurableTaskDef[]> {
    const seeds: Array<[string, string, string, DurableMachine]> = [
      ['echo', 'echo', 'Identity / smoke handler', 'small'],
      ['delay-demo', 'echo', 'Demo durable run (echo payload)', 'small'],
      ['fail-demo', 'fail', 'Demo failure + retry path', 'small'],
    ];
    const out: DurableTaskDef[] = [];
    for (const [id, handler, description, machine] of seeds) {
      const existing = await this.getTask(id);
      if (existing && existing.handler === handler) {
        out.push(existing);
        continue;
      }
      out.push(await this.defineTask({ id, handler, description, machine }));
    }
    return out;
  }

  async trigger(
    taskId: string,
    payload: Record<string, unknown> = {},
    ownership: { userId?: string; projectId?: string } = {},
    authorizationId?: string
  ): Promise<{ run: DurableRun; publicRunToken: string }> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error(`Unknown DurableTask: ${taskId}`);
    const runId = newId('run');
    const token = `prt_${crypto.randomBytes(16).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    await this.client()
      .insert(durableRuns)
      .values({
        id: runId,
        ownerUserId: this.ownerUserId,
        taskId: task.id,
        taskVersion: task.deployedVersion ?? task.version,
        status: 'QUEUED',
        payload,
        attempt: 0,
        ownership,
        machine: task.machine,
        publicTokenHash: tokenHash,
        authorizationId: authorizationId || null,
        createdAt: now,
        updatedAt: now,
      });
    await this.appendEvent({
      runId,
      type: 'run.queued',
      data: { taskId: task.id, taskVersion: task.deployedVersion },
    });
    return { run: (await this.getRun(runId))!, publicRunToken: token };
  }

  async listRuns(filter: { taskId?: string; status?: string } = {}): Promise<DurableRun[]> {
    const conds = [eq(durableRuns.ownerUserId, this.ownerUserId)];
    if (filter.taskId) conds.push(eq(durableRuns.taskId, filter.taskId));
    if (filter.status) conds.push(eq(durableRuns.status, filter.status));
    const rows = await this.client()
      .select()
      .from(durableRuns)
      .where(and(...conds))
      .orderBy(desc(durableRuns.createdAt))
      .limit(500);
    return rows.map(toRun);
  }

  async getRun(runId: string): Promise<DurableRun | undefined> {
    const rows = await this.client()
      .select()
      .from(durableRuns)
      .where(and(eq(durableRuns.ownerUserId, this.ownerUserId), eq(durableRuns.id, runId)))
      .limit(1);
    return rows[0] ? toRun(rows[0]) : undefined;
  }

  async cancelRun(runId: string): Promise<DurableRun> {
    const run = await this.getRun(runId);
    if (!run) throw new Error(`Unknown run: ${runId}`);
    if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELLED') {
      return run;
    }
    const now = new Date();
    await this.client()
      .update(durableRuns)
      .set({ status: 'CANCELLED', updatedAt: now, completedAt: now })
      .where(and(eq(durableRuns.ownerUserId, this.ownerUserId), eq(durableRuns.id, runId)));
    await this.appendEvent({ runId, type: 'run.cancelled' });
    return (await this.getRun(runId))!;
  }

  async replayRun(
    runId: string,
    authorizationId?: string
  ): Promise<{ run: DurableRun; publicRunToken: string }> {
    const prior = await this.getRun(runId);
    if (!prior) throw new Error(`Unknown run: ${runId}`);
    return this.trigger(
      prior.taskId,
      { ...prior.payload },
      { ...prior.ownership },
      authorizationId
    );
  }

  async appendEvent(input: {
    runId: string;
    type: string;
    data?: unknown;
  }): Promise<DurableRunEvent> {
    let seq = 1;
    if (input.runId) {
      const last = await this.client()
        .select({ seq: durableRunEvents.seq })
        .from(durableRunEvents)
        .where(eq(durableRunEvents.runId, input.runId))
        .orderBy(desc(durableRunEvents.seq))
        .limit(1);
      seq = (last[0]?.seq || 0) + 1;
    }
    const id = newId('evt');
    const at = new Date();
    await this.client()
      .insert(durableRunEvents)
      .values({
        id,
        ownerUserId: this.ownerUserId,
        runId: input.runId || '',
        seq,
        type: input.type,
        data: input.data ?? null,
        at,
      });
    return { seq, runId: input.runId, type: input.type, at: at.toISOString(), data: input.data };
  }

  async listRunEvents(runId: string, sinceSeq = 0): Promise<DurableRunEvent[]> {
    const rows = await this.client()
      .select()
      .from(durableRunEvents)
      .where(
        and(
          eq(durableRunEvents.ownerUserId, this.ownerUserId),
          eq(durableRunEvents.runId, runId),
          gt(durableRunEvents.seq, sinceSeq)
        )
      )
      .orderBy(asc(durableRunEvents.seq));
    return rows.map((r) => ({
      seq: r.seq,
      runId: r.runId,
      type: r.type,
      at: r.at.toISOString(),
      data: r.data ?? undefined,
    }));
  }

  async addSchedule(input: {
    id: string;
    taskId: string;
    everyMs: number;
    payload?: Record<string, unknown>;
    enabled?: boolean;
  }): Promise<DurableSchedule> {
    if (!(await this.getTask(input.taskId))) {
      throw new Error(`Unknown DurableTask: ${input.taskId}`);
    }
    const existing = await this.client()
      .select()
      .from(durableSchedules)
      .where(
        and(eq(durableSchedules.ownerUserId, this.ownerUserId), eq(durableSchedules.id, input.id))
      )
      .limit(1);
    if (existing[0]) throw new Error(`Schedule exists: ${input.id}`);
    const now = new Date();
    await this.client()
      .insert(durableSchedules)
      .values({
        id: input.id,
        ownerUserId: this.ownerUserId,
        taskId: input.taskId,
        everyMs: Math.max(1000, input.everyMs),
        payload: input.payload ?? null,
        enabled: input.enabled !== false,
        createdAt: now,
      });
    return (await this.listSchedules()).find((s) => s.id === input.id)!;
  }

  async listSchedules(): Promise<DurableSchedule[]> {
    const rows = await this.client()
      .select()
      .from(durableSchedules)
      .where(eq(durableSchedules.ownerUserId, this.ownerUserId))
      .orderBy(asc(durableSchedules.id));
    return rows.map(toSchedule);
  }

  async setScheduleEnabled(id: string, enabled: boolean): Promise<DurableSchedule> {
    const updated = await this.client()
      .update(durableSchedules)
      .set({ enabled })
      .where(and(eq(durableSchedules.ownerUserId, this.ownerUserId), eq(durableSchedules.id, id)))
      .returning();
    if (!updated[0]) throw new Error(`Unknown schedule: ${id}`);
    return toSchedule(updated[0]);
  }

  async fireDueSchedules(now = Date.now()): Promise<string[]> {
    const all = await this.listSchedules();
    const fired: string[] = [];
    for (const s of all) {
      if (!s.enabled) continue;
      const last = s.lastFiredAt ? Date.parse(s.lastFiredAt) : 0;
      if (now - last < s.everyMs) continue;
      const result = await this.trigger(s.taskId, { ...(s.payload || {}), _scheduleId: s.id });
      await this.client()
        .update(durableSchedules)
        .set({ lastFiredAt: new Date() })
        .where(
          and(eq(durableSchedules.ownerUserId, this.ownerUserId), eq(durableSchedules.id, s.id))
        );
      fired.push(result.run.id);
    }
    return fired;
  }

  async tickOnce(runId?: string): Promise<DurableRun | null> {
    const conds = [eq(durableRuns.ownerUserId, this.ownerUserId), eq(durableRuns.status, 'QUEUED')];
    if (runId) conds.push(eq(durableRuns.id, runId));
    const queued = await this.client()
      .select()
      .from(durableRuns)
      .where(and(...conds))
      .orderBy(asc(durableRuns.createdAt))
      .limit(1);
    if (!queued[0]) {
      if (!runId) await this.fireDueSchedules();
      return null;
    }
    const runRow = queued[0];
    const task = await this.getTask(runRow.taskId);
    const handler = task?.handler || 'echo';
    const machine = (runRow.machine as DurableMachine) || task?.machine || 'small';
    const started = Date.now();
    const startedAt = new Date();
    await this.client()
      .update(durableRuns)
      .set({
        status: 'RUNNING',
        attempt: runRow.attempt + 1,
        startedAt,
        updatedAt: startedAt,
      })
      .where(eq(durableRuns.id, runRow.id));
    await this.appendEvent({
      runId: runRow.id,
      type: 'run.started',
      data: { attempt: runRow.attempt + 1, handler },
    });

    try {
      if (handler === 'fail') throw new Error('Intentional fail handler');
      if (handler === 'fail-once' && runRow.attempt + 1 < 2) {
        throw new Error('fail-once: retry');
      }
      const result = { echoed: runRow.payload, handler, at: nowIso() };
      const durationMs = Math.max(1, Date.now() - started);
      const estimatedCostUnits = Number(
        ((durationMs / 1000) * machineCostPerSecond(machine)).toFixed(4)
      );
      const completedAt = new Date();
      await this.client()
        .update(durableRuns)
        .set({
          status: 'COMPLETED',
          result,
          durationMs,
          estimatedCostUnits,
          completedAt,
          updatedAt: completedAt,
          error: null,
        })
        .where(eq(durableRuns.id, runRow.id));
      await this.appendEvent({
        runId: runRow.id,
        type: 'run.completed',
        data: { durationMs, estimatedCostUnits },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const attempt = runRow.attempt + 1;
      if (attempt < DEFAULT_MAX_ATTEMPTS && handler !== 'fail') {
        await this.client()
          .update(durableRuns)
          .set({ status: 'QUEUED', error: message, updatedAt: new Date() })
          .where(eq(durableRuns.id, runRow.id));
        await this.appendEvent({
          runId: runRow.id,
          type: 'run.retry',
          data: { attempt, error: message },
        });
      } else {
        const durationMs = Math.max(1, Date.now() - started);
        const estimatedCostUnits = Number(
          ((durationMs / 1000) * machineCostPerSecond(machine)).toFixed(4)
        );
        const completedAt = new Date();
        await this.client()
          .update(durableRuns)
          .set({
            status: 'FAILED',
            error: message,
            durationMs,
            estimatedCostUnits,
            completedAt,
            updatedAt: completedAt,
          })
          .where(eq(durableRuns.id, runRow.id));
        await this.appendEvent({
          runId: runRow.id,
          type: 'run.failed',
          data: { error: message },
        });
      }
    }
    await this.fireDueSchedules();
    return (await this.getRun(runRow.id)) || null;
  }

  /** Sum estimated cost units for this owner in the current UTC month. */
  async monthCostUnits(): Promise<number> {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const rows = await this.client()
      .select({
        total: sql<number>`coalesce(sum(${durableRuns.estimatedCostUnits}), 0)`,
      })
      .from(durableRuns)
      .where(and(eq(durableRuns.ownerUserId, this.ownerUserId), gt(durableRuns.createdAt, start)));
    return Number(rows[0]?.total || 0);
  }
}
