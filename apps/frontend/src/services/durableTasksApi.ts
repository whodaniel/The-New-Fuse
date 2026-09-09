import { authFetch } from '@/utils/authToken';
import { config } from '../config';

const base = () => `${config.apiUrl}/durable-tasks`;

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message || body?.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return res.json() as Promise<T>;
}

export type DurableMachine = 'small' | 'medium' | 'large';

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
  status: string;
  payload: Record<string, unknown>;
  attempt: number;
  result?: unknown;
  error?: string;
  machine?: DurableMachine;
  durationMs?: number;
  estimatedCostUnits?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
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

export const durableTasksApi = {
  async listTasks(): Promise<DurableTaskDef[]> {
    const res = await authFetch(`${base()}/tasks`);
    const data = await parse<{ tasks: DurableTaskDef[] }>(res);
    return data.tasks || [];
  },

  async defineTask(body: {
    id: string;
    handler?: string;
    description?: string;
    machine?: DurableMachine;
  }): Promise<DurableTaskDef> {
    const res = await authFetch(`${base()}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await parse<{ task: DurableTaskDef }>(res);
    return data.task;
  },

  async trigger(
    taskId: string,
    payload: Record<string, unknown> = {}
  ): Promise<{ run: DurableRun; publicRunToken: string }> {
    const res = await authFetch(`${base()}/tasks/${encodeURIComponent(taskId)}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, drain: true }),
    });
    return parse(res);
  },

  async listRuns(params?: { taskId?: string; status?: string }): Promise<DurableRun[]> {
    const q = new URLSearchParams();
    if (params?.taskId) q.set('taskId', params.taskId);
    if (params?.status) q.set('status', params.status);
    const res = await authFetch(`${base()}/runs${q.toString() ? `?${q}` : ''}`);
    const data = await parse<{ runs: DurableRun[] }>(res);
    return data.runs || [];
  },

  async getRun(runId: string): Promise<DurableRun> {
    const res = await authFetch(`${base()}/runs/${encodeURIComponent(runId)}`);
    const data = await parse<{ run: DurableRun }>(res);
    return data.run;
  },

  async cancelRun(runId: string): Promise<DurableRun> {
    const res = await authFetch(`${base()}/runs/${encodeURIComponent(runId)}/cancel`, {
      method: 'POST',
    });
    const data = await parse<{ run: DurableRun }>(res);
    return data.run;
  },

  async replayRun(runId: string): Promise<{ run: DurableRun }> {
    const res = await authFetch(`${base()}/runs/${encodeURIComponent(runId)}/replay`, {
      method: 'POST',
    });
    return parse(res);
  },

  async listEvents(runId: string, since = 0): Promise<DurableRunEvent[]> {
    const res = await authFetch(
      `${base()}/runs/${encodeURIComponent(runId)}/events?since=${since}`
    );
    const data = await parse<{ events: DurableRunEvent[] }>(res);
    return data.events || [];
  },

  async listSchedules(): Promise<DurableSchedule[]> {
    const res = await authFetch(`${base()}/schedules`);
    const data = await parse<{ schedules: DurableSchedule[] }>(res);
    return data.schedules || [];
  },

  async addSchedule(body: {
    id: string;
    taskId: string;
    everyMs: number;
    payload?: Record<string, unknown>;
  }): Promise<DurableSchedule> {
    const res = await authFetch(`${base()}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await parse<{ schedule: DurableSchedule }>(res);
    return data.schedule;
  },

  async setScheduleEnabled(id: string, enabled: boolean): Promise<DurableSchedule> {
    const res = await authFetch(`${base()}/schedules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await parse<{ schedule: DurableSchedule }>(res);
    return data.schedule;
  },

  async drain(max = 20): Promise<number> {
    const res = await authFetch(`${base()}/drain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max }),
    });
    const data = await parse<{ advanced: number }>(res);
    return data.advanced;
  },

  async usage(): Promise<{
    backend: string;
    monthCostUnits: number;
    freeUnitsMonth: number;
    remainingFreeUnits: number;
    unitUsd: number;
    enforce: boolean;
    queue?: { available: boolean; tenants: number; depth: number };
    workerEnabled?: boolean;
  }> {
    const res = await authFetch(`${base()}/usage`);
    return parse(res);
  },
};
