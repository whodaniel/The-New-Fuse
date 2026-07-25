/**
 * Protocol agent roster — clear ACTIVE / INACTIVE listing for `tnf boot` and `tnf tui`.
 *
 * Source of truth for "known by the TNF protocol" at runtime:
 *   Redis hash `tnf:agent-registry` (TNF bus registrations)
 *
 * Catalog size (classified definitions) comes from
 *   `.tnf/agent-registry-snapshot.json` when present.
 *
 * Presence rules (aligned with RedisAgentClient.listAgents):
 *   ACTIVE   — status is not offline/archived AND lastSeen within 2× heartbeat (60s)
 *   INACTIVE — everything else still registered on the bus
 */
import chalk from 'chalk';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const PROTOCOL_HEARTBEAT_MS = 30_000;
export const PROTOCOL_ONLINE_WINDOW_MS = PROTOCOL_HEARTBEAT_MS * 2;

export type RosterPresence = 'active' | 'inactive';

export type ProtocolRosterEntry = {
  id: string;
  name: string;
  role: string;
  platform: string;
  presence: RosterPresence;
  status: string;
  lastSeen: string | null;
  instanceCount: number;
};

export type ProtocolAgentRoster = {
  source: 'redis' | 'unavailable';
  generatedAt: string;
  active: ProtocolRosterEntry[];
  inactive: ProtocolRosterEntry[];
  registrationCount: number;
  uniqueAgentCount: number;
  knownCatalogCount: number | null;
  error?: string;
};

type RawRegistryAgent = {
  id: string;
  name: string;
  role: string;
  platform: string;
  status: string;
  lastSeen: string | null;
  isOnline?: boolean;
};

export function parseLastSeenMs(
  lastSeen: string | null | undefined,
  nowMs = Date.now()
): number | null {
  if (!lastSeen) return null;
  const ms = Date.parse(lastSeen);
  if (Number.isNaN(ms)) return null;
  return ms;
}

export function classifyPresence(
  agent: Pick<RawRegistryAgent, 'status' | 'lastSeen' | 'isOnline'>,
  nowMs = Date.now(),
  onlineWindowMs = PROTOCOL_ONLINE_WINDOW_MS
): RosterPresence {
  const status = String(agent.status || '')
    .trim()
    .toLowerCase();
  if (status === 'offline' || status === 'archived') {
    return 'inactive';
  }

  const lastSeenMs = parseLastSeenMs(agent.lastSeen, nowMs);
  if (lastSeenMs !== null && nowMs - lastSeenMs <= onlineWindowMs) {
    return 'active';
  }

  // Trust an explicit fresh isOnline only when lastSeen is missing.
  if (lastSeenMs === null && agent.isOnline === true) {
    return 'active';
  }

  return 'inactive';
}

export function formatAge(lastSeen: string | null, nowMs = Date.now()): string {
  const lastSeenMs = parseLastSeenMs(lastSeen, nowMs);
  if (lastSeenMs === null) return 'never';
  const seconds = Math.max(0, Math.floor((nowMs - lastSeenMs) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function readKnownCatalogCount(repoRoot: string): number | null {
  const candidates = [
    path.join(repoRoot, '.tnf', 'agent-registry-snapshot.json'),
    path.join(process.env.HOME || '', '.tnf', 'agent-registry-snapshot.json'),
    path.join(repoRoot, 'data', 'agent-registry', 'agents.json'),
  ];
  for (const candidate of candidates) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (Array.isArray(parsed)) return parsed.length;
      if (Array.isArray(parsed?.agents)) return parsed.agents.length;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export function parseRedisHgetallPairs(raw: string): RawRegistryAgent[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  const out: RawRegistryAgent[] = [];

  for (let i = 0; i + 1 < lines.length; i += 2) {
    const id = lines[i];
    const payload = lines[i + 1];
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      out.push({
        id: String(parsed.id || id),
        name: String(parsed.name || parsed.id || id),
        role: String(parsed.role || 'unknown'),
        platform: String(parsed.platform || 'unknown'),
        status: String(parsed.status || 'unknown'),
        lastSeen: typeof parsed.lastSeen === 'string' ? parsed.lastSeen : null,
        isOnline: typeof parsed.isOnline === 'boolean' ? parsed.isOnline : undefined,
      });
    } catch {
      // skip malformed entries
    }
  }

  return out;
}

export function buildRosterFromRawAgents(
  rawAgents: RawRegistryAgent[],
  options?: {
    nowMs?: number;
    knownCatalogCount?: number | null;
    source?: ProtocolAgentRoster['source'];
    error?: string;
  }
): ProtocolAgentRoster {
  const nowMs = options?.nowMs ?? Date.now();
  const byName = new Map<string, RawRegistryAgent[]>();

  for (const agent of rawAgents) {
    const key = agent.name.trim().toLowerCase() || agent.id.trim().toLowerCase();
    if (!key) continue;
    const group = byName.get(key) || [];
    group.push(agent);
    byName.set(key, group);
  }

  const entries: ProtocolRosterEntry[] = [];
  for (const group of byName.values()) {
    const sorted = [...group].sort((a, b) => {
      const aMs = parseLastSeenMs(a.lastSeen, nowMs) ?? 0;
      const bMs = parseLastSeenMs(b.lastSeen, nowMs) ?? 0;
      return bMs - aMs;
    });
    const best = sorted[0];
    entries.push({
      id: best.id,
      name: best.name,
      role: best.role,
      platform: best.platform,
      presence: classifyPresence(best, nowMs),
      status: best.status,
      lastSeen: best.lastSeen,
      instanceCount: group.length,
    });
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  const active = entries.filter((e) => e.presence === 'active');
  const inactive = entries.filter((e) => e.presence === 'inactive');

  return {
    source: options?.source ?? 'redis',
    generatedAt: new Date(nowMs).toISOString(),
    active,
    inactive,
    registrationCount: rawAgents.length,
    uniqueAgentCount: entries.length,
    knownCatalogCount: options?.knownCatalogCount ?? null,
    error: options?.error,
  };
}

function fetchRedisRegistryRaw(): { ok: true; raw: string } | { ok: false; error: string } {
  try {
    const result = spawnSync('redis-cli', ['HGETALL', 'tnf:agent-registry'], {
      encoding: 'utf8',
      timeout: 2500,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    if (result.status !== 0) {
      const stderr = (result.stderr || '').trim();
      return { ok: false, error: stderr || `redis-cli exited ${result.status}` };
    }
    return { ok: true, raw: result.stdout || '' };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Canonical TNF protocol network agents (wrappers / core processes). */
export const PROTOCOL_NETWORK_AGENTS: Array<{
  name: string;
  role: string;
  platform: string;
  processPattern: string;
}> = [
  {
    name: 'antigravity',
    // Platform wrappers are workers by default. The baton holder is master-clock
    // (ORCHESTRATOR-{ts}), not any particular fulfillment platform. Orchestration
    // capabilities may still be assigned via capabilities / workerAction.
    role: 'worker',
    platform: 'antigravity',
    processPattern: 'antigravity-redis-wrapper',
  },
  { name: 'claude', role: 'broker', platform: 'claude', processPattern: 'claude-redis-wrapper' },
  { name: 'gemini', role: 'worker', platform: 'gemini', processPattern: 'gemini-redis-wrapper' },
  { name: 'jules', role: 'worker', platform: 'jules', processPattern: 'jules-redis-wrapper' },
  { name: 'pi', role: 'worker', platform: 'pi', processPattern: 'pi-redis-wrapper' },
  {
    name: 'model-watchdog',
    role: 'broker',
    platform: 'watchdog',
    processPattern: 'model-watchdog-failover-consumer',
  },
  {
    name: 'BROKER-Green',
    role: 'broker',
    platform: 'tnf-runtime',
    processPattern: 'federation-channel-broker',
  },
  {
    name: 'TNF Runtime Broker',
    role: 'broker',
    platform: 'broker-agent',
    processPattern: 'broker-agent',
  },
  {
    name: 'TNF Runtime Director',
    role: 'director',
    platform: 'director-agent',
    processPattern: 'director-agent',
  },
];

export function isProcessRunning(pattern: string): boolean {
  try {
    const result = spawnSync('pgrep', ['-f', pattern], {
      encoding: 'utf8',
      timeout: 1500,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return result.status === 0 && Boolean((result.stdout || '').trim());
  } catch {
    return false;
  }
}

export function discoverNetworkAgents(nowMs = Date.now()): RawRegistryAgent[] {
  const iso = new Date(nowMs).toISOString();
  return PROTOCOL_NETWORK_AGENTS.map((agent) => {
    const running = isProcessRunning(agent.processPattern);
    return {
      id: `network:${agent.platform}`,
      name: agent.name,
      role: agent.role,
      platform: agent.platform,
      status: running ? 'active' : 'offline',
      lastSeen: running ? iso : null,
      isOnline: running,
    };
  });
}

function mergeRawAgents(...groups: RawRegistryAgent[][]): RawRegistryAgent[] {
  // Prefer Redis rows; network discovery fills gaps for known protocol agents.
  const out: RawRegistryAgent[] = [];
  const seenNames = new Set<string>();
  for (const group of groups) {
    for (const agent of group) {
      const key = agent.name.trim().toLowerCase();
      if (!key) continue;
      // Always keep Redis registrations (may have multiple instances).
      // For network-only fills, skip names already present from Redis.
      if (group !== groups[0] && seenNames.has(key)) continue;
      out.push(agent);
      seenNames.add(key);
    }
  }
  return out;
}

export function loadProtocolAgentRoster(repoRoot: string, nowMs = Date.now()): ProtocolAgentRoster {
  const knownCatalogCount = readKnownCatalogCount(repoRoot);
  const networkAgents = discoverNetworkAgents(nowMs);
  const fetched = fetchRedisRegistryRaw();

  if (!fetched.ok) {
    // Still show known protocol network agents when Redis is down.
    const roster = buildRosterFromRawAgents(networkAgents, {
      nowMs,
      knownCatalogCount,
      source: 'unavailable',
      error: fetched.error,
    });
    return roster;
  }

  const redisAgents = parseRedisHgetallPairs(fetched.raw);
  // Promote network-running agents: if process is up, stamp a fresh lastSeen so
  // they land in ACTIVE even when Redis heartbeats are stale.
  const runningNetwork = new Map(
    networkAgents.filter((a) => a.isOnline).map((a) => [a.name.toLowerCase(), a])
  );
  const enrichedRedis = redisAgents.map((agent) => {
    const live = runningNetwork.get(agent.name.toLowerCase());
    if (!live) return agent;
    return {
      ...agent,
      status: 'active',
      isOnline: true,
      lastSeen: live.lastSeen || agent.lastSeen,
    };
  });
  const merged = mergeRawAgents(enrichedRedis, networkAgents);

  return buildRosterFromRawAgents(merged, {
    nowMs,
    knownCatalogCount,
    source: 'redis',
  });
}

function printEntry(entry: ProtocolRosterEntry, nowMs: number, active: boolean): void {
  const mark = active ? chalk.green('●') : chalk.yellow('○');
  const name = chalk.bold(entry.name.padEnd(28).slice(0, 28));
  const meta = chalk.dim(`${entry.role}/${entry.platform}`);
  const age = formatAge(entry.lastSeen, nowMs);
  const statusLabel = (active ? 'ACTIVE' : 'INACTIVE').padEnd(8);
  const status = active ? chalk.green(statusLabel) : chalk.yellow(statusLabel);
  const instances = entry.instanceCount > 1 ? chalk.dim(`  ×${entry.instanceCount}`) : '';
  console.log(`  ${mark} ${status}  ${name} ${meta}  ${chalk.dim(age)}${instances}`);
}

/**
 * Print a clear, obvious ACTIVE + INACTIVE agent roster for operators.
 * Never throws — roster display must not break boot/tui.
 */
export function printProtocolAgentRoster(
  roster: ProtocolAgentRoster,
  options?: { nowMs?: number; title?: string }
): void {
  const nowMs = options?.nowMs ?? Date.now();
  const title = options?.title ?? 'TNF Protocol Agents';

  console.log('');
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════'));

  if (roster.knownCatalogCount != null) {
    console.log(chalk.dim(`  Protocol catalog definitions known: ${roster.knownCatalogCount}`));
  }

  if (roster.source === 'unavailable') {
    console.log(chalk.yellow('  Bus registry unavailable — showing known network agents only.'));
    if (roster.error) {
      console.log(chalk.dim(`  Reason: ${roster.error}`));
    }
  } else {
    console.log(
      chalk.dim(
        `  Bus registrations: ${roster.registrationCount} across ${roster.uniqueAgentCount} agent name(s)`
      )
    );
  }
  console.log('');

  console.log(chalk.bold.green(`  ● ACTIVE (${roster.active.length})`));
  if (roster.active.length === 0) {
    console.log(chalk.dim('      (none — no live process / fresh heartbeat)'));
  } else {
    for (const entry of roster.active) {
      printEntry(entry, nowMs, true);
    }
  }

  console.log('');
  console.log(chalk.bold.yellow(`  ○ INACTIVE (${roster.inactive.length})`));
  if (roster.inactive.length === 0) {
    console.log(chalk.dim('      (none)'));
  } else {
    for (const entry of roster.inactive) {
      printEntry(entry, nowMs, false);
    }
  }

  console.log('');
  console.log(chalk.dim('  Hint: `tnf list` for full IDs · `tnf agents classify` for catalog'));
  console.log('');
}

export function printProtocolAgentRosterSafe(repoRoot: string): ProtocolAgentRoster | null {
  try {
    const roster = loadProtocolAgentRoster(repoRoot);
    printProtocolAgentRoster(roster);
    return roster;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(chalk.yellow(`\n  ⚠️  Could not render protocol agent roster: ${message}\n`));
    return null;
  }
}
