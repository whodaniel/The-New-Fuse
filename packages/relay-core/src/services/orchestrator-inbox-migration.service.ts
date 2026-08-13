/**
 * Orphaned ORCHESTRATOR session inbox migration.
 *
 * Handoff packets are often addressed to `ORCHESTRATOR-{timestamp}` (the master-
 * clock baton identity for a single process lifetime). When the baton rotates,
 * those inboxes become orphaned. Role and platform are orthogonal — this is
 * about session identity, not which CLI/platform holds a seat.
 *
 * Supports both live key shapes:
 *   - `tnf:handoff:v1:inbox:ORCHESTRATOR-*` (pi-redis-wrapper / wrappers)
 *   - `tnf:handoff:v1:inbox:agent:ORCHESTRATOR-*` (HandoffStoreService)
 */

export type RedisListClient = {
  keys(pattern: string): Promise<string[]>;
  llen(key: string): Promise<number>;
  rpop(key: string): Promise<string | null>;
  lpush(key: string, ...values: string[]): Promise<number>;
  rpoplpush?(source: string, destination: string): Promise<string | null>;
};

export type MigrateOrphanedOrchestratorInboxesOptions = {
  keyPrefix?: string;
  /** Cap moves per call to avoid flooding a newly elected baton. */
  maxMove?: number;
};

export type MigrateOrphanedOrchestratorInboxesResult = {
  activeSessionId: string;
  migrated: number;
  sources: string[];
  destinationKeys: string[];
};

const DEFAULT_PREFIX = 'tnf:handoff:v1';
const DEFAULT_MAX_MOVE = 5000;

export function isOrchestratorSessionId(value: string): boolean {
  return /^ORCHESTRATOR-\d+$/i.test(String(value || '').trim());
}

export function orchestratorInboxKeys(
  sessionId: string,
  keyPrefix = DEFAULT_PREFIX
): { legacy: string; store: string } {
  return {
    legacy: `${keyPrefix}:inbox:${sessionId}`,
    store: `${keyPrefix}:inbox:agent:${sessionId}`,
  };
}

/**
 * Extract ORCHESTRATOR session id from an inbox key, or null if not matching.
 */
export function parseOrchestratorInboxKey(key: string, keyPrefix = DEFAULT_PREFIX): string | null {
  const legacy = new RegExp(`^${escapeRegExp(keyPrefix)}:inbox:(ORCHESTRATOR-\\d+)$`, 'i');
  const store = new RegExp(`^${escapeRegExp(keyPrefix)}:inbox:agent:(ORCHESTRATOR-\\d+)$`, 'i');
  const m = key.match(legacy) || key.match(store);
  return m?.[1] || null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function moveListItems(
  redis: RedisListClient,
  source: string,
  dest: string,
  remaining: { count: number }
): Promise<number> {
  let moved = 0;
  while (remaining.count > 0) {
    let item: string | null = null;
    if (typeof redis.rpoplpush === 'function' && source !== dest) {
      item = await redis.rpoplpush(source, dest);
    } else {
      item = await redis.rpop(source);
      if (item) {
        await redis.lpush(dest, item);
      }
    }
    if (!item) break;
    moved += 1;
    remaining.count -= 1;
  }
  return moved;
}

/**
 * Move packets from inactive ORCHESTRATOR-* inboxes onto the active baton
 * session inboxes (both key shapes).
 */
export async function migrateOrphanedOrchestratorInboxes(
  redis: RedisListClient,
  activeSessionId: string,
  options: MigrateOrphanedOrchestratorInboxesOptions = {}
): Promise<MigrateOrphanedOrchestratorInboxesResult> {
  const keyPrefix = options.keyPrefix || DEFAULT_PREFIX;
  const maxMove = Math.max(0, options.maxMove ?? DEFAULT_MAX_MOVE);
  const active = String(activeSessionId || '').trim();

  if (!isOrchestratorSessionId(active)) {
    return {
      activeSessionId: active,
      migrated: 0,
      sources: [],
      destinationKeys: [],
    };
  }

  const dest = orchestratorInboxKeys(active, keyPrefix);
  const patterns = [`${keyPrefix}:inbox:ORCHESTRATOR-*`, `${keyPrefix}:inbox:agent:ORCHESTRATOR-*`];

  const sourceKeys = new Set<string>();
  for (const pattern of patterns) {
    const found = await redis.keys(pattern);
    for (const key of found || []) {
      const session = parseOrchestratorInboxKey(key, keyPrefix);
      if (!session) continue;
      if (session.toLowerCase() === active.toLowerCase()) continue;
      sourceKeys.add(key);
    }
  }

  const remaining = { count: maxMove };
  let migrated = 0;
  const sources: string[] = [];

  for (const source of sourceKeys) {
    if (remaining.count <= 0) break;
    const session = parseOrchestratorInboxKey(source, keyPrefix);
    if (!session) continue;
    // Preserve key shape: legacy → legacy, store → store.
    const destination = source.includes(':inbox:agent:') ? dest.store : dest.legacy;
    const before = remaining.count;
    const moved = await moveListItems(redis, source, destination, remaining);
    if (moved > 0) {
      sources.push(source);
      migrated += moved;
    } else if (before === remaining.count) {
      // Empty or already drained.
      continue;
    }
  }

  return {
    activeSessionId: active,
    migrated,
    sources,
    destinationKeys: [dest.legacy, dest.store],
  };
}

/**
 * Read active baton session id from `tnf:master:state` orchestrator field.
 */
export function parseActiveOrchestratorSessionId(raw: unknown): string | null {
  if (raw == null) return null;
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      const trimmed = raw.trim();
      return isOrchestratorSessionId(trimmed) ? trimmed : null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const sessionId = String((parsed as { sessionId?: unknown }).sessionId || '').trim();
  return isOrchestratorSessionId(sessionId) ? sessionId : null;
}
