/**
 * packages/tnf-cli/src/tasks/cron.ts
 *
 * Quota-stalled agent watchdog + replacement dispatcher.
 *
 * Periodically scans the canonical relay-core master registry
 * (`tnf:master:agents` hash) for agents whose heartbeat has gone stale
 * (default > 60s) or whose status is explicitly marked `stalled`. When a
 * stalled agent is detected, an `agent.stalled` event is emitted on the
 * shared `EventEmitter` so the orchestrator / director layer can spawn a
 * replacement.
 *
 * Reads the same Redis keys as `packages/relay-core/src/master-clock.ts`
 * (CONFIG.REDIS_KEYS.AGENTS = `tnf:master:agents`,
 *  CONFIG.REDIS_KEYS.HEARTBEATS = `tnf:master:heartbeats`) so this watchdog
 * observes the *actual* registry, not a stale sidecar hash.
 *
 * Safe to run when Redis is unreachable — the function logs and returns
 * gracefully rather than throwing.
 */
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

/** Default staleness window: 60s without heartbeat => stalled. */
export const STALL_THRESHOLD_MS = Number.parseInt(
  process.env.TNF_AGENT_STALL_THRESHOLD_MS || '60000',
  10
);

/** Default scan frequency: every 30s. */
export const SCAN_INTERVAL_MS = Number.parseInt(
  process.env.TNF_AGENT_SCAN_INTERVAL_MS || '30000',
  10
);

/** Canonical Redis keys, mirroring packages/relay-core/src/master-clock.ts. */
export const RELAY_AGENTS_KEY = process.env.TNF_RELAY_AGENTS_KEY || 'tnf:master:agents';
export const RELAY_HEARTBEATS_KEY = process.env.TNF_RELAY_HEARTBEATS_KEY || 'tnf:master:heartbeats';

export interface StallEvent {
  agentId: string;
  lastHeartbeat: number;
  idleMs: number;
  status: string;
  /** Raw payload from tnf:master:agents when available. */
  payload?: Record<string, unknown> | null;
}

export const agentStallEmitter = new EventEmitter();

/**
 * Lazily build a Redis client. We use a fresh `ioredis` client (same pattern as
 * `orchestration-enhancements.ts`) rather than the long-lived
 * `RedisAgentClient` class so a one-off cron invocation cannot deadlock a
 * daemon. The factory memoises per-process.
 */
let cachedClient: Redis | null = null;
export function buildRedisClient(): Redis {
  if (cachedClient) return cachedClient;
  cachedClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  cachedClient.on('error', () => {
    // swallow; callers handle "no connection" via try/catch on commands
  });
  return cachedClient;
}

/**
 * Scan the relay registry for stalled agents and emit `agent.stalled` events.
 *
 * Returns the count of stalls detected (useful for tests / metrics).
 */
export async function checkStalledAgents(
  client?: Redis,
  now: number = Date.now()
): Promise<number> {
  const conn = client ?? buildRedisClient();
  let agents: Record<string, string> = {};
  let heartbeats: Record<string, string> = {};
  try {
    const [a, h] = await Promise.all([
      conn.hgetall(RELAY_AGENTS_KEY),
      conn.hgetall(RELAY_HEARTBEATS_KEY),
    ]);
    agents = a ?? {};
    heartbeats = h ?? {};
  } catch {
    // offline / unreachable — treat as zero stalls, do not throw
    return 0;
  }

  let stalls = 0;
  for (const [agentId, rawStatus] of Object.entries(agents)) {
    if (!agentId) continue;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(rawStatus);
    } catch {
      parsed = { status: rawStatus };
    }
    const status = String(parsed.status || parsed.lifecycle || '').toLowerCase();
    const heartbeatRaw = heartbeats[agentId] ?? parsed.lastHeartbeat;
    const lastHeartbeat = Number.parseInt(String(heartbeatRaw ?? 0), 10);
    const idleMs = lastHeartbeat > 0 ? now - lastHeartbeat : STALL_THRESHOLD_MS + 1;

    const isStalled =
      status === 'stalled' ||
      status === 'offline' ||
      (lastHeartbeat > 0 && idleMs > STALL_THRESHOLD_MS);

    if (isStalled) {
      agentStallEmitter.emit('agent.stalled', {
        agentId,
        lastHeartbeat,
        idleMs,
        status: status || 'unknown',
        payload: parsed,
      } as StallEvent);
      stalls += 1;
    }
  }
  return stalls;
}

/**
 * Schedule periodic stall scans. Returns a handle (`stop()`) so the caller
 * (CLI entrypoint, daemon supervisor, tests) can disable the timer cleanly.
 */
export function scheduleAgentReplacement(intervalMs: number = SCAN_INTERVAL_MS): { stop(): void } {
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const tick = async () => {
    if (stopped) return;
    try {
      await checkStalledAgents();
    } catch {
      // never let an exception kill the loop
    } finally {
      if (!stopped) {
        timer = setTimeout(tick, intervalMs);
      }
    }
  };

  // Kick the first scan immediately so callers see results without waiting
  // a full `intervalMs`, then settle into the steady cadence.
  void tick();

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export default {
  checkStalledAgents,
  scheduleAgentReplacement,
  STALL_THRESHOLD_MS,
  SCAN_INTERVAL_MS,
  RELAY_AGENTS_KEY,
  RELAY_HEARTBEATS_KEY,
  agentStallEmitter,
};
