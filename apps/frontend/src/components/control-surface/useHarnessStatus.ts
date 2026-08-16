import { authFetch } from '@/utils/authToken';
import { rateLimitAwareInterval } from '@/utils/rateLimitCoordinator';
import { useQuery } from '@tanstack/react-query';

export type HarnessFleetMode = {
  mode: string;
  paused: boolean;
  reason: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type HarnessStatusData = {
  timestamp: string;
  fleet: HarnessFleetMode;
  harness: {
    version?: string;
    role?: string;
    layers?: Record<string, { status: string; gap?: string }>;
  } | null;
  relay: {
    alive: Record<string, string> | null;
    registryCount: number;
    agents: Array<{ id: string; name: string; role: string; status: string }>;
  };
  lastCycle: Record<string, unknown> | null;
};

async function fetchHarnessStatus(): Promise<HarnessStatusData | null> {
  const res = await authFetch('/api/harness/status');
  if (!res.ok) return null;
  const body = await res.json();
  return body?.data ?? null;
}

export function useHarnessStatus() {
  return useQuery({
    queryKey: ['harness-status'],
    queryFn: fetchHarnessStatus,
    refetchInterval: rateLimitAwareInterval(15_000),
    staleTime: 10_000,
  });
}
