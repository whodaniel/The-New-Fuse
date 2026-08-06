import { authFetch } from '@/utils/authToken';
import { rateLimitAwareInterval } from '@/utils/rateLimitCoordinator';
import { useQuery } from '@tanstack/react-query';

export type LocalGoalTask = {
  id: string;
  description: string;
  completed: boolean;
};

export type LocalGoal = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  progress: number;
  tags: string[];
  tasks: LocalGoalTask[];
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LocalCronJob = {
  id: string;
  schedule: string;
  command: string;
  label: string;
  scheduleHuman: string;
  nextRunAt: string | null;
  enabled: boolean;
  raw: string;
};

export type Unavailable = { available: false; reason: string; generatedAt?: string };

export type LocalGoalsResult =
  | {
      available: true;
      source: string;
      activeGoalId: string | null;
      goals: LocalGoal[];
      generatedAt: string;
    }
  | Unavailable;

export type LocalCronResult =
  | { available: true; source: string; jobs: LocalCronJob[]; generatedAt: string }
  | Unavailable;

export type MirrorBounds = { x: number; y: number; width: number; height: number };

export type MirrorDisplay = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  main?: boolean;
};

export type MirrorWindow = {
  windowId: number | null;
  agentId: string | null;
  tty: string | null;
  title: string | null;
  busy: boolean;
  agentLike: boolean;
  cwd: string | null;
  foregroundCommand: string | null;
  bounds: MirrorBounds | null;
  display: number | null;
  zOrder: number | null;
  matched: boolean | null;
  sessionStatus: string | null;
  lastActivityAt: string | null;
  contentsTail?: string | null;
};

export type TerminalMirrorResult =
  | {
      available: true;
      source: string;
      generatedAt: string | null;
      stale: boolean;
      ageSeconds: number | null;
      displays: MirrorDisplay[];
      windows: MirrorWindow[];
    }
  | Unavailable;

export type LocalRuntimeSummary = {
  goals: LocalGoalsResult;
  cron: LocalCronResult;
  terminalMirror:
    | {
        available: true;
        windowCount: number;
        busyCount: number;
        agentCount: number;
        stale: boolean;
        ageSeconds: number | null;
      }
    | { available: false; reason: string };
  generatedAt: string;
};

export type SystemProcess = {
  id: string;
  title: string;
  description: string;
  canonical: { scope: string; category: string; locked: boolean };
  procedural: {
    enabled: boolean;
    cadence: string;
    timezone: string;
    nextRunAt: string | null;
    nextRunHint: string;
  };
  runtime: {
    status: string;
    lastRunAt: string | null;
    lastExitCode: number | null;
    lastError: string | null;
  };
  controls: { canRunNow: boolean; runDeniedReason: string | null };
};

export type SystemProcessesResult = {
  generatedAt: string;
  summary: { total: number; enabled: number; disabled: number; healthy: number; errored: number };
  processes: SystemProcess[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await authFetch(url);
  if (response.status === 429) {
    throw new Error(`${url} rate-limited (429)`);
  }
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }
  return response.json();
}

export function useLocalRuntimeSummary() {
  return useQuery<LocalRuntimeSummary>({
    queryKey: ['local-runtime', 'summary'],
    queryFn: () => fetchJson<LocalRuntimeSummary>('/api/local-runtime/summary'),
    refetchInterval: () => rateLimitAwareInterval(30_000),
    staleTime: 20_000,
    retry: (failureCount, error) => {
      if (String((error as Error)?.message || '').includes('429')) return false;
      return failureCount < 1;
    },
  });
}

export function useTerminalMirror(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const baseInterval = options.refetchInterval ?? 15_000;
  return useQuery<TerminalMirrorResult>({
    queryKey: ['local-runtime', 'terminal-mirror'],
    queryFn: () => fetchJson<TerminalMirrorResult>('/api/local-runtime/terminal-mirror'),
    refetchInterval: () => rateLimitAwareInterval(baseInterval),
    enabled: options.enabled ?? true,
    retry: (failureCount, error) => {
      if (String((error as Error)?.message || '').includes('429')) return false;
      return failureCount < 1;
    },
  });
}

export function useSystemProcesses(options: { enabled?: boolean } = {}) {
  return useQuery<SystemProcessesResult>({
    queryKey: ['admin', 'chronological-processes'],
    queryFn: () => fetchJson<SystemProcessesResult>('/api/admin/metrics/chronological-processes'),
    refetchInterval: () => rateLimitAwareInterval(60_000),
    enabled: options.enabled ?? true,
    retry: (failureCount, error) => {
      if (String((error as Error)?.message || '').includes('429')) return false;
      return failureCount < 1;
    },
  });
}

export async function runSystemProcessNow(processId: string): Promise<unknown> {
  const response = await authFetch(
    `/api/admin/metrics/chronological-processes/${encodeURIComponent(processId)}/run`,
    { method: 'POST' }
  );
  if (!response.ok) {
    throw new Error(`Run-now failed with ${response.status}`);
  }
  return response.json();
}
