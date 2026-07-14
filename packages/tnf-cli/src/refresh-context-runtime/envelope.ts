// Refresh context runtime — TNF-bus envelope mirroring.
// Mirrors `make_envelope()` from the Hermes TNF agent daemon so any
// payload published here is byte-compat with the existing broker. We do
// not modify the daemon; this just lets the CLI speak its wire format.

import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export const REFRESH_CONTEXT_PROTOCOL_VERSION = '1.0';

export interface RefreshContextEnvelope {
  id: string;
  type: 'context_refresh' | 'context_refresh_announce';
  version: string;
  timestamp: string;
  from: {
    agentId: string;
    agentName: string;
    role: string;
    platform: string;
  };
  to: {
    agentId: string;
    channel: string;
    broadcast?: boolean;
  };
  payload: {
    protocolsInjected: string[];
    agentsUpdated: string[];
    snapshotId: string;
    issuedAt: string;
    reason?: string;
  };
  context?: {
    parentMessageId?: string;
  };
}

export interface RefreshContextAgentRef {
  id: string;
  name?: string;
  role?: string;
  platform?: string;
  capabilities?: string[];
  isOnline?: boolean;
}

export interface RefreshContextDiff {
  startedAt: string;
  finishedAt: string;
  fromAgent: string;
  redis: { url: string; host: string; port: number; db: number; available: boolean };
  registryAgentCount: number;
  agentsReached: number;
  agentsNotReached: string[];
  protocolsInjected: string[];
  degraded: string[];
  resolved: string[];
  envelopeIds: string[];
}

export interface BuildEnvelopeParams {
  fromAgent: RefreshContextAgentRef;
  toAgentId: string;
  protocolsInjected: string[];
  agentsUpdated: string[];
  snapshotId: string;
  parentMessageId?: string;
  type?: 'context_refresh' | 'context_refresh_announce';
  reason?: string;
}

export function buildRefreshEnvelope(params: BuildEnvelopeParams): RefreshContextEnvelope {
  return {
    id: uuidv4(),
    type: params.type || 'context_refresh',
    version: REFRESH_CONTEXT_PROTOCOL_VERSION,
    timestamp: new Date().toISOString(),
    from: {
      agentId: params.fromAgent.id,
      agentName: params.fromAgent.name || params.fromAgent.id,
      role: params.fromAgent.role || 'worker',
      platform: params.fromAgent.platform || 'tnf-cli',
    },
    to: {
      agentId: params.toAgentId,
      channel: `tnf:bus:egress:${params.toAgentId}`,
    },
    payload: {
      protocolsInjected: params.protocolsInjected,
      agentsUpdated: params.agentsUpdated,
      snapshotId: params.snapshotId,
      issuedAt: new Date().toISOString(),
      ...(params.reason ? { reason: params.reason } : {}),
    },
    ...(params.parentMessageId ? { context: { parentMessageId: params.parentMessageId } } : {}),
  };
}

/**
 * Build the system-wide broadcast envelope (channel `tnf:bus:ingress`)
 * announcing the refresh to all listeners.
 */
export function buildAnnounceEnvelope(
  diff: RefreshContextDiff,
  fromAgentId: string = 'agent:tnf-cli'
): RefreshContextEnvelope {
  return {
    id: uuidv4(),
    type: 'context_refresh_announce',
    version: REFRESH_CONTEXT_PROTOCOL_VERSION,
    timestamp: new Date().toISOString(),
    from: {
      agentId: fromAgentId,
      agentName: 'TNF CLI Refresh Context',
      role: 'orchestrator',
      platform: 'tnf-cli',
    },
    to: {
      agentId: '*',
      channel: 'tnf:bus:ingress',
      broadcast: true,
    },
    payload: {
      protocolsInjected: diff.protocolsInjected,
      agentsUpdated:
        diff.agentsReached > 0 ? Array.from({ length: diff.agentsReached }, () => '*') : [],
      snapshotId: diff.envelopeIds[0] || diff.startedAt,
      issuedAt: diff.startedAt,
      reason: `refresh-context: ${diff.registryAgentCount} registry · ${diff.agentsReached} reached · ${diff.degraded.length} degraded`,
    },
  };
}

export interface RedisConnectionConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export function resolveRedisConfig(): RedisConnectionConfig & {
  url: string;
  host: string;
  port: number;
  db: number;
} {
  const url = process.env.REDIS_URL || process.env.TNF_REDIS_URL || 'redis://127.0.0.1:6379/0';

  let parsedHost = '127.0.0.1';
  let parsedPort = 6379;
  let parsedDb = 0;
  let parsedPassword: string | undefined;

  try {
    const u = new URL(url);
    if (u.hostname) parsedHost = u.hostname;
    if (u.port) parsedPort = Number(u.port);
    if (u.pathname && u.pathname.length > 1) {
      const tail = Number(u.pathname.replace(/\//g, ''));
      if (!Number.isNaN(tail)) parsedDb = tail;
    }
    if (u.password) parsedPassword = decodeURIComponent(u.password);
  } catch {
    // fall through with defaults
  }

  return {
    url,
    host: parsedHost,
    port: parsedPort,
    db: parsedDb,
    password: parsedPassword,
  };
}

export async function pingRedis(client: Redis, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    client
      .ping()
      .then(() => {
        clearTimeout(timer);
        finish(true);
      })
      .catch(() => {
        clearTimeout(timer);
        finish(false);
      });
  });
}

/**
 * Fetch the agent registry as `id -> parsed JSON` from `tnf:agent-registry`.
 * Returns an empty map when the hash is missing or empty.
 */
export async function fetchAgentRegistry(
  client: Redis
): Promise<Record<string, RefreshContextAgentRef>> {
  const raw = (await client.hgetall('tnf:agent-registry')) as Record<string, string>;
  const out: Record<string, RefreshContextAgentRef> = {};
  for (const [id, json] of Object.entries(raw || {})) {
    try {
      const parsed = JSON.parse(json);
      out[id] = {
        id,
        name: parsed.name || parsed.agentName || id,
        role: parsed.role,
        platform: parsed.platform,
        capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : [],
        isOnline: parsed.isOnline ?? parsed.status === 'active',
      };
    } catch {
      out[id] = { id, name: id, isOnline: false };
    }
  }
  return out;
}
