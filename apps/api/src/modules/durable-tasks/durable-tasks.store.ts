/**
 * Per-user DurableTask cloud store (file-backed).
 * Mirrors CLI ~/.tnf/durable-tasks semantics for SaaS tenants.
 * Path: {TNF_DURABLE_CLOUD_ROOT|TNF_HOME/cloud-durable-tasks}/<userId>/
 * Postgres migration can replace this without changing the controller surface.
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export type DurableMachine = 'small' | 'medium' | 'large';
export type DurableRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface DurableTaskDef {
  id: string;
  version: number;
  handler: string;
  description?: string;
  queue: { name: string; concurrencyLimit: number };
  machine: DurableMachine;
  deployedVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface DurableRun {
  id: string;
  taskId: string;
  taskVersion: number;
  status: DurableRunStatus;
  payload: Record<string, unknown>;
  attempt: number;
  ownership: { userId?: string; projectId?: string };
  result?: unknown;
  error?: string;
  publicTokenHash?: string;
  machine?: DurableMachine;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  /** Estimated billable units for future metering (not charged yet). */
  estimatedCostUnits?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DurableSchedule {
  id: string;
  taskId: string;
  everyMs: number;
  payload?: Record<string, unknown>;
  enabled: boolean;
  lastFiredAt?: string;
  createdAt: string;
}

export interface DurableRunEvent {
  seq: number;
  runId: string;
  type: string;
  at: string;
  data?: unknown;
}

const DEFAULT_RETRY = {
  maxAttempts: 3,
  factor: 1.8,
  minTimeoutInMs: 50,
  maxTimeoutInMs: 5_000,
};

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/** Rough relative cost units per machine-second (TNF-owned economics, not Trigger rates). */
export function machineCostPerSecond(machine: DurableMachine): number {
  switch (machine) {
    case 'large':
      return 4;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

export function cloudDurableRoot(): string {
  return (
    process.env.TNF_DURABLE_CLOUD_ROOT ||
    path.join(process.env.TNF_HOME || path.join(os.homedir(), '.tnf'), 'cloud-durable-tasks')
  );
}

export class CloudDurableTaskStore {
  private root: string;
  private tasksPath: string;
  private runsPath: string;
  private schedulesPath: string;
  private eventsPath: string;
  private tokensPath: string;

  constructor(userId: string) {
    const safe = userId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'anonymous';
    this.root = path.join(cloudDurableRoot(), safe);
    this.tasksPath = path.join(this.root, 'tasks.json');
    this.runsPath = path.join(this.root, 'runs.json');
    this.schedulesPath = path.join(this.root, 'schedules.json');
    this.eventsPath = path.join(this.root, 'run-events.jsonl');
    this.tokensPath = path.join(this.root, 'public-run-tokens.json');
    fs.mkdirSync(this.root, { recursive: true });
  }

  private readJson<T>(filePath: string, fallback: T): T {
    if (!fs.existsSync(filePath)) return fallback;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    } catch {
      return fallback;
    }
  }

  private writeJson(filePath: string, value: unknown): void {
    const tmp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, filePath);
  }

  defineTask(input: {
    id: string;
    handler?: string;
    description?: string;
    queueName?: string;
    concurrencyLimit?: number;
    machine?: DurableMachine;
  }): DurableTaskDef {
    const id = String(input.id || '').trim();
    if (!id) throw new Error('task id required');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id)) {
      throw new Error('task id must be alphanumeric with ._-:');
    }
    const tasks = this.readJson<DurableTaskDef[]>(this.tasksPath, []);
    const existing = tasks.find((t) => t.id === id);
    const version = existing ? existing.version + 1 : 1;
    const def: DurableTaskDef = {
      id,
      version,
      handler: input.handler || existing?.handler || 'echo',
      description: input.description ?? existing?.description,
      queue: {
        name: input.queueName || existing?.queue.name || 'default',
        concurrencyLimit: input.concurrencyLimit ?? existing?.queue.concurrencyLimit ?? 5,
      },
      machine: input.machine || existing?.machine || 'small',
      deployedVersion: existing?.deployedVersion ?? version,
      createdAt: existing?.createdAt || nowIso(),
      updatedAt: nowIso(),
    };
    if (existing) Object.assign(existing, def);
    else tasks.push(def);
    this.writeJson(this.tasksPath, tasks);
    this.appendEvent({ runId: '', type: 'task.defined', data: { taskId: id, version } });
    return def;
  }

  listTasks(): DurableTaskDef[] {
    return this.readJson<DurableTaskDef[]>(this.tasksPath, []).sort((a, b) =>
      a.id.localeCompare(b.id)
    );
  }

  getTask(id: string): DurableTaskDef | undefined {
    return this.readJson<DurableTaskDef[]>(this.tasksPath, []).find((t) => t.id === id);
  }

  ensureBootstrapTasks(): DurableTaskDef[] {
    const seeds: Array<[string, string, string, DurableMachine]> = [
      ['echo', 'echo', 'Identity / smoke handler', 'small'],
      ['delay-demo', 'echo', 'Demo durable run (echo payload)', 'small'],
      ['fail-demo', 'fail', 'Demo failure + retry path', 'small'],
    ];
    const out: DurableTaskDef[] = [];
    for (const [id, handler, description, machine] of seeds) {
      const existing = this.getTask(id);
      if (existing && existing.handler === handler) {
        out.push(existing);
        continue;
      }
      out.push(this.defineTask({ id, handler, description, machine, queueName: 'default' }));
    }
    return out;
  }

  private mintPublicRunToken(runId: string): string {
    const token = `prt_${crypto.randomBytes(16).toString('hex')}`;
    const tokens = this.readJson<Array<{ token: string; runId: string; createdAt: string }>>(
      this.tokensPath,
      []
    );
    tokens.push({ token, runId, createdAt: nowIso() });
    this.writeJson(this.tokensPath, tokens);
    const runs = this.readJson<DurableRun[]>(this.runsPath, []);
    const run = runs.find((r) => r.id === runId);
    if (run) {
      run.publicTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      run.updatedAt = nowIso();
      this.writeJson(this.runsPath, runs);
    }
    return token;
  }

  trigger(
    taskId: string,
    payload: Record<string, unknown> = {},
    ownership: { userId?: string; projectId?: string } = {}
  ): { run: DurableRun; publicRunToken: string } {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Unknown DurableTask: ${taskId}`);
    const pinVersion = task.deployedVersion ?? task.version;
    const run: DurableRun = {
      id: newId('run'),
      taskId: task.id,
      taskVersion: pinVersion,
      status: 'QUEUED',
      payload,
      attempt: 0,
      ownership,
      machine: task.machine,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const runs = this.readJson<DurableRun[]>(this.runsPath, []);
    runs.push(run);
    this.writeJson(this.runsPath, runs);
    this.appendEvent({
      runId: run.id,
      type: 'run.queued',
      data: { taskId: task.id, taskVersion: pinVersion },
    });
    const publicRunToken = this.mintPublicRunToken(run.id);
    return { run: this.getRun(run.id)!, publicRunToken };
  }

  listRuns(filter: { taskId?: string; status?: string } = {}): DurableRun[] {
    return this.readJson<DurableRun[]>(this.runsPath, [])
      .filter((r) => (filter.taskId ? r.taskId === filter.taskId : true))
      .filter((r) => (filter.status ? r.status === filter.status : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getRun(runId: string): DurableRun | undefined {
    return this.readJson<DurableRun[]>(this.runsPath, []).find((r) => r.id === runId);
  }

  cancelRun(runId: string): DurableRun {
    const runs = this.readJson<DurableRun[]>(this.runsPath, []);
    const run = runs.find((r) => r.id === runId);
    if (!run) throw new Error(`Unknown run: ${runId}`);
    if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELLED') {
      return run;
    }
    run.status = 'CANCELLED';
    run.updatedAt = nowIso();
    run.completedAt = nowIso();
    this.writeJson(this.runsPath, runs);
    this.appendEvent({ runId, type: 'run.cancelled' });
    return run;
  }

  replayRun(runId: string): { run: DurableRun; publicRunToken: string } {
    const prior = this.getRun(runId);
    if (!prior) throw new Error(`Unknown run: ${runId}`);
    return this.trigger(prior.taskId, { ...prior.payload }, { ...prior.ownership });
  }

  appendEvent(input: { runId: string; type: string; data?: unknown }): DurableRunEvent {
    const seq = this.nextEventSeq();
    const ev: DurableRunEvent = {
      seq,
      runId: input.runId,
      type: input.type,
      at: nowIso(),
      data: input.data,
    };
    fs.appendFileSync(this.eventsPath, `${JSON.stringify(ev)}\n`, 'utf8');
    return ev;
  }

  private nextEventSeq(): number {
    if (!fs.existsSync(this.eventsPath)) return 1;
    const lines = fs.readFileSync(this.eventsPath, 'utf8').split('\n').filter(Boolean);
    if (!lines.length) return 1;
    try {
      const last = JSON.parse(lines[lines.length - 1]);
      return (last.seq || lines.length) + 1;
    } catch {
      return lines.length + 1;
    }
  }

  listRunEvents(runId: string, sinceSeq = 0): DurableRunEvent[] {
    if (!fs.existsSync(this.eventsPath)) return [];
    const out: DurableRunEvent[] = [];
    for (const line of fs.readFileSync(this.eventsPath, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const ev = JSON.parse(line) as DurableRunEvent;
        if (ev.runId === runId && ev.seq > sinceSeq) out.push(ev);
      } catch {
        /* skip */
      }
    }
    return out;
  }

  addSchedule(input: {
    id: string;
    taskId: string;
    everyMs: number;
    payload?: Record<string, unknown>;
    enabled?: boolean;
  }): DurableSchedule {
    if (!this.getTask(input.taskId)) throw new Error(`Unknown DurableTask: ${input.taskId}`);
    const all = this.readJson<DurableSchedule[]>(this.schedulesPath, []);
    if (all.find((s) => s.id === input.id)) throw new Error(`Schedule exists: ${input.id}`);
    const row: DurableSchedule = {
      id: input.id,
      taskId: input.taskId,
      everyMs: Math.max(1000, input.everyMs),
      payload: input.payload,
      enabled: input.enabled !== false,
      createdAt: nowIso(),
    };
    all.push(row);
    this.writeJson(this.schedulesPath, all);
    return row;
  }

  listSchedules(): DurableSchedule[] {
    return this.readJson<DurableSchedule[]>(this.schedulesPath, []);
  }

  setScheduleEnabled(id: string, enabled: boolean): DurableSchedule {
    const all = this.readJson<DurableSchedule[]>(this.schedulesPath, []);
    const row = all.find((s) => s.id === id);
    if (!row) throw new Error(`Unknown schedule: ${id}`);
    row.enabled = enabled;
    this.writeJson(this.schedulesPath, all);
    return row;
  }

  fireDueSchedules(now = Date.now()): string[] {
    const all = this.readJson<DurableSchedule[]>(this.schedulesPath, []);
    const fired: string[] = [];
    let changed = false;
    for (const s of all) {
      if (!s.enabled) continue;
      const last = s.lastFiredAt ? Date.parse(s.lastFiredAt) : 0;
      if (now - last < s.everyMs) continue;
      const result = this.trigger(s.taskId, { ...(s.payload || {}), _scheduleId: s.id });
      s.lastFiredAt = nowIso();
      fired.push(result.run.id);
      changed = true;
    }
    if (changed) this.writeJson(this.schedulesPath, all);
    return fired;
  }

  /** Process one QUEUED run with built-in cloud handlers. Optional runId for fair-queue claims. */
  async tickOnce(runId?: string): Promise<boolean> {
    const runs = this.readJson<DurableRun[]>(this.runsPath, []);
    const run = runId
      ? runs.find((r) => r.id === runId && r.status === 'QUEUED')
      : runs.find((r) => r.status === 'QUEUED');
    if (!run) {
      if (!runId) this.fireDueSchedules();
      return false;
    }
    const task = this.getTask(run.taskId);
    const handler = task?.handler || 'echo';
    const machine = run.machine || task?.machine || 'small';
    run.status = 'RUNNING';
    run.attempt += 1;
    run.startedAt = nowIso();
    run.updatedAt = nowIso();
    this.writeJson(this.runsPath, runs);
    this.appendEvent({
      runId: run.id,
      type: 'run.started',
      data: { attempt: run.attempt, handler },
    });

    const started = Date.now();
    try {
      let result: unknown;
      if (handler === 'fail') {
        throw new Error('Intentional fail handler');
      }
      if (handler === 'fail-once' && run.attempt < 2) {
        throw new Error('fail-once: retry');
      }
      // echo + delay-demo + unknown → echo payload
      result = { echoed: run.payload, handler, at: nowIso() };
      const durationMs = Math.max(1, Date.now() - started);
      run.status = 'COMPLETED';
      run.result = result;
      run.completedAt = nowIso();
      run.durationMs = durationMs;
      run.estimatedCostUnits = Number(
        ((durationMs / 1000) * machineCostPerSecond(machine)).toFixed(4)
      );
      run.updatedAt = nowIso();
      this.writeJson(this.runsPath, runs);
      this.appendEvent({
        runId: run.id,
        type: 'run.completed',
        data: { durationMs, estimatedCostUnits: run.estimatedCostUnits },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const maxAttempts = DEFAULT_RETRY.maxAttempts;
      if (run.attempt < maxAttempts && handler !== 'fail') {
        run.status = 'QUEUED';
        run.error = message;
        run.updatedAt = nowIso();
        this.writeJson(this.runsPath, runs);
        this.appendEvent({
          runId: run.id,
          type: 'run.retry',
          data: { attempt: run.attempt, error: message },
        });
      } else {
        const durationMs = Math.max(1, Date.now() - started);
        run.status = 'FAILED';
        run.error = message;
        run.completedAt = nowIso();
        run.durationMs = durationMs;
        run.estimatedCostUnits = Number(
          ((durationMs / 1000) * machineCostPerSecond(machine)).toFixed(4)
        );
        run.updatedAt = nowIso();
        this.writeJson(this.runsPath, runs);
        this.appendEvent({ runId: run.id, type: 'run.failed', data: { error: message } });
      }
    }
    this.fireDueSchedules();
    return true;
  }
}
