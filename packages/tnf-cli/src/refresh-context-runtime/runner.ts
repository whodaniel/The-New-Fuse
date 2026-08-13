// Refresh context runner — orchestrates the read/discover/validate/publish
// pipeline and writes `.context-injected` atomically.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import type { Redis } from 'ioredis';
import {
  discoverDaemons,
  readContextInjectedFile,
  unionAgents,
  verifyProtocols,
  type DiscoveredAgent,
  type ProtocolContractRef,
} from './discovery.js';
import {
  buildAnnounceEnvelope,
  buildRefreshEnvelope,
  fetchAgentRegistry,
  pingRedis,
  resolveRedisConfig,
  type RefreshContextAgentRef,
  type RefreshContextDiff,
  type RefreshContextEnvelope,
} from './envelope.js';

export interface RefreshContextOptions {
  repoRoot: string;
  tnfHome: string;
  dryRun: boolean;
  onlyAgentIds?: string[];
  onlyProtocolIds?: string[];
  sinceISO?: string;
  fromAgent?: RefreshContextAgentRef;
  reason?: string;
}

export interface RefreshContextResult {
  diff: RefreshContextDiff;
  envelopes: RefreshContextEnvelope[];
  unresolvedProtocols: ProtocolContractRef[];
  dryRun: boolean;
  freshContextInjectedPath: string | null;
}

const DEFAULT_FROM_AGENT: RefreshContextAgentRef = {
  id: 'agent:tnf-cli',
  name: 'TNF CLI Refresh Context',
  role: 'orchestrator',
  platform: 'tnf-cli',
  capabilities: ['refresh-context', 'protocol-injection', 'bus-publish'],
};

export async function runRefreshContext(
  redis: Redis | null,
  redisAvailable: boolean,
  options: RefreshContextOptions
): Promise<RefreshContextResult> {
  const startedAt = new Date().toISOString();
  const fromAgent = options.fromAgent || DEFAULT_FROM_AGENT;

  const previous = await readContextInjectedFile(options.tnfHome);
  const declaredProtocols = new Set<string>(
    previous?.protocolsInjected ?? [
      'stall-defense',
      'handoff-matrix',
      'gates-of-truth',
      'tnf-bridge',
      'openclaw-sync',
      'directive-rotation',
    ]
  );
  if (options.onlyProtocolIds && options.onlyProtocolIds.length > 0) {
    for (const id of options.onlyProtocolIds) declaredProtocols.add(id);
  }

  const protocolRefs = await verifyProtocols(options.repoRoot, Array.from(declaredProtocols));
  const unresolvedProtocols = protocolRefs.filter((p) => !p.contractPresent);

  const previousAgentsUpdated = previous?.agentsUpdated ?? [];
  const registryAgents: Record<string, RefreshContextAgentRef> =
    redis && redisAvailable ? await fetchAgentRegistry(redis).catch(() => ({})) : {};
  const discovered = unionAgents(registryAgents, previousAgentsUpdated);
  const daemonKeys = await discoverDaemons(options.tnfHome);
  for (const key of daemonKeys) {
    const id = key.startsWith('agent:') ? key : `agent:${key}`;
    if (!discovered.some((d) => d.id === id)) {
      discovered.push({ id, name: id, source: 'daemon-state' });
    }
  }

  const filtered: DiscoveredAgent[] = options.onlyAgentIds?.length
    ? discovered.filter((d) => options.onlyAgentIds!.includes(d.id))
    : discovered;

  const snapshotId = `refresh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const envelopes: RefreshContextEnvelope[] = [];
  const agentsReached: string[] = [];
  const agentsNotReached: string[] = [];

  for (const agent of filtered) {
    const envelope = buildRefreshEnvelope({
      fromAgent,
      toAgentId: agent.id,
      protocolsInjected: protocolRefs.filter((p) => p.contractPresent).map((p) => p.id),
      agentsUpdated: filtered.map((d) => d.id),
      snapshotId,
      reason: options.reason,
    });
    envelopes.push(envelope);
    if (!options.dryRun && redis && redisAvailable) {
      try {
        await redis.publish(envelope.to.channel, JSON.stringify(envelope));
        agentsReached.push(agent.id);
      } catch (err) {
        agentsNotReached.push(agent.id);
      }
    } else {
      agentsReached.push(agent.id);
    }
  }

  const finishedAt = new Date().toISOString();
  const redisCfg = resolveRedisConfig();

  const diff: RefreshContextDiff = {
    startedAt,
    finishedAt,
    fromAgent: fromAgent.id,
    redis: {
      url: redisCfg.url,
      host: redisCfg.host,
      port: redisCfg.port,
      db: redisCfg.db,
      available: redisAvailable,
    },
    registryAgentCount: Object.keys(registryAgents).length,
    agentsReached: agentsReached.length,
    agentsNotReached,
    protocolsInjected: protocolRefs.filter((p) => p.contractPresent).map((p) => p.id),
    degraded: unresolvedProtocols.map((p) => `protocol:contract_missing:${p.id}`),
    resolved: previous?.previousStatus === 'failed' ? ['context-injected:restored'] : [],
    envelopeIds: envelopes.map((e) => e.id),
  };

  // Build envelopes that already went out + a system-wide announce
  const announceEnvelope = buildAnnounceEnvelope(diff);
  if (!options.dryRun && redis && redisAvailable) {
    try {
      await redis.publish(announceEnvelope.to.channel, JSON.stringify(announceEnvelope));
    } catch {
      diff.degraded.push('announce:publish_failed');
    }
  }

  // Persist new .context-injected exactly once
  let freshContextInjectedPath: string | null = null;
  if (!options.dryRun) {
    freshContextInjectedPath = await writeContextInjected(
      options.tnfHome,
      previous,
      protocolRefs,
      diff,
      filtered
    );
  }

  return {
    diff,
    envelopes,
    unresolvedProtocols,
    dryRun: options.dryRun,
    freshContextInjectedPath,
  };
}

async function writeContextInjected(
  tnfHome: string,
  previous: Awaited<ReturnType<typeof readContextInjectedFile>>,
  protocolRefs: ProtocolContractRef[],
  diff: RefreshContextDiff,
  discovered: DiscoveredAgent[]
): Promise<string> {
  const filePath = path.join(tnfHome, '.context-injected');
  const backupPath = `${filePath}.${diff.startedAt.replace(/[^0-9]/g, '')}.bak`;

  const presentProtocols = protocolRefs.filter((p) => p.contractPresent);
  const status =
    diff.degraded.length === 0
      ? 'completed'
      : diff.agentsReached === 0
        ? 'failed'
        : 'completed_with_degradations';

  const payload: Record<string, unknown> = {
    lastInjection: diff.finishedAt,
    protocolsInjected: presentProtocols.map((p) => p.id),
    agentsUpdated: discovered.map((d) => d.id),
    validationStatus: status,
    prunedStale: previous?.previousStatus === 'failed',
    degradations: diff.degraded,
    resolved: diff.resolved,
    fromAgent: diff.fromAgent,
    redis: diff.redis,
    envelopeIds: diff.envelopeIds,
    registryAgentCount: diff.registryAgentCount,
    agentsReached: diff.agentsReached,
    previouslyInjected: previous?.previousInjection ?? null,
    previouslyInjectedProtocols: previous?.protocolsInjected ?? [],
  };

  // Backup the existing file (only if it exists) with atomic rename
  try {
    await fs.rename(filePath, backupPath);
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      // Don't fail the operation for backup issues
    }
  }

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return filePath;
}

/**
 * For tests / runner entry-point: wrap `runRefreshContext` with the
 * standard connection dance so callers don't have to.
 */
export async function executeRefreshContextWithRedis(
  options: RefreshContextOptions
): Promise<RefreshContextResult> {
  const { createStandaloneRedisClient } = await import('@the-new-fuse/infrastructure');
  const cfg = resolveRedisConfig();
  const client = createStandaloneRedisClient({
    url: cfg.url,
    lazyConnect: false,
  } as any) as Redis;
  let available = false;
  try {
    available = await pingRedis(client);
  } catch {
    available = false;
  }

  try {
    return await runRefreshContext(client, available, options);
  } finally {
    try {
      await client.quit();
    } catch {
      // ignore
    }
  }
}
