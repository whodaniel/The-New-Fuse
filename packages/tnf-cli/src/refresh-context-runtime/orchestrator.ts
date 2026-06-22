// Orchestrator: discover → verify → publish → record diff → write state file.

import { Redis } from 'ioredis';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

import {
  discoverDaemons,
  DiscoveredAgent,
  readContextInjectedFile,
  unionAgents,
  verifyProtocols,
} from './discovery.js';
import {
  buildAnnounceEnvelope,
  buildRefreshEnvelope,
  fetchAgentRegistry,
  pingRedis,
  RefreshContextAgentRef,
  RefreshContextDiff,
  resolveRedisConfig,
} from './envelope.js';

export interface RefreshContextOptions {
  repoRoot: string;
  tnfHome: string;
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  agentPlatform?: string;
  onlyAgent?: string;
  onlyProtocol?: string;
  dryRun?: boolean;
  json?: boolean;
  now?: () => Date;
}

export interface RefreshContextReport {
  diff: RefreshContextDiff;
  before: {
    filePath: string | null;
    lastInjection: string | null;
    protocolsInjected: string[];
    agentsUpdated: string[];
  };
  after: {
    filePath: string;
    lastInjection: string;
    protocolsInjected: string[];
    agentsUpdated: string[];
    validationStatus: string;
    prunedStale: boolean;
    degradations: string[];
    resolved: string[];
  };
  protocolContracts: Record<string, { path: string | null; contractPresent: boolean }>;
  agents: DiscoveredAgent[];
}

export interface RefreshContextRunResult {
  ok: boolean;
  report?: RefreshContextReport;
  error?: string;
}

const BROADCAST_AGENT_ID = '*';
const REFRESH_CONTEXT_STATE_NAMESPACE = 'tnf:context:injected';

function cloneDiff(diff: RefreshContextDiff): RefreshContextDiff {
  return {
    ...diff,
    protocolsInjected: [...diff.protocolsInjected],
    degraded: [...diff.degraded],
    resolved: [...diff.resolved],
    agentsNotReached: [...diff.agentsNotReached],
    envelopeIds: [...diff.envelopeIds],
  };
}

async function writeContextInjected(
  tnfHome: string,
  payload: {
    lastInjection: string;
    protocolsInjected: string[];
    agentsUpdated: string[];
    validationStatus: string;
    prunedStale: boolean;
    degradations: string[];
    resolved: string[];
  }
): Promise<string> {
  const filePath = path.join(tnfHome, '.context-injected');
  const tmpPath = `${filePath}.${uuidv4()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  await fs.rename(tmpPath, filePath);
  return filePath;
}

async function snapshotContext(tnfHome: string): Promise<{
  filePath: string | null;
  lastInjection: string | null;
  protocolsInjected: string[];
  agentsUpdated: string[];
  validationStatus: string | null;
}> {
  const ctx = await readContextInjectedFile(tnfHome);
  if (!ctx) {
    return {
      filePath: null,
      lastInjection: null,
      protocolsInjected: [],
      agentsUpdated: [],
      validationStatus: null,
    };
  }
  return {
    filePath: ctx.filePath,
    lastInjection: ctx.previousInjection,
    protocolsInjected: ctx.protocolsInjected,
    agentsUpdated: ctx.agentsUpdated,
    validationStatus: ctx.previousStatus,
  };
}

function filterAgents(agents: DiscoveredAgent[], onlyAgent: string | undefined): DiscoveredAgent[] {
  if (!onlyAgent) return agents;
  const needle = onlyAgent.toLowerCase();
  return agents.filter((a) => a.id.toLowerCase().includes(needle));
}

function filterProtocols(protocols: string[], onlyProtocol: string | undefined): string[] {
  if (!onlyProtocol) return protocols;
  const needle = onlyProtocol.toLowerCase();
  return protocols.filter((p) => p.toLowerCase().includes(needle));
}

export async function runRefreshContext(
  options: RefreshContextOptions
): Promise<RefreshContextRunResult> {
  const startedAt = (options.now ? options.now() : new Date()).toISOString();
  const ctx = await snapshotContext(options.tnfHome);

  const candidateProtocols =
    ctx.protocolsInjected.length > 0
      ? ctx.protocolsInjected
      : ['turn-zero', 'tnf-bridge', 'handoff-validation', 'context-refresh'];

  const protocolsToInject = filterProtocols(candidateProtocols, options.onlyProtocol);
  const contracts = await verifyProtocols(options.repoRoot, protocolsToInject);
  const degradations: string[] = [];
  for (const c of contracts) {
    if (!c.contractPresent) {
      degradations.push(`protocol:${c.id}:contract_missing`);
    }
  }

  const config = resolveRedisConfig();
  let registryAgents: Record<string, RefreshContextAgentRef> = {};
  let redisAvailable = false;
  let client: Redis | null = null;

  if (!options.dryRun) {
    client = new Redis({
      host: config.host,
      port: config.port,
      db: config.db,
      ...(config.password ? { password: config.password } : {}),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redisAvailable = await pingRedis(client);
    if (redisAvailable) {
      try {
        registryAgents = await fetchAgentRegistry(client);
      } catch (err: any) {
        degradations.push(`registry:fetch_failed:${err?.message ?? 'unknown'}`);
      }
    } else {
      degradations.push('redis:unreachable');
    }
  }

  const daemonIds = await discoverDaemons(options.tnfHome);
  for (const id of daemonIds) {
    if (!registryAgents[id]) {
      registryAgents[id] = {
        id,
        name: id,
        isOnline: true,
        platform: 'tnf-daemon',
        role: 'worker',
      };
    }
  }

  let agents = unionAgents(registryAgents, ctx.agentsUpdated);
  agents = filterAgents(agents, options.onlyAgent);

  const fromAgent: RefreshContextAgentRef = {
    id: options.agentId || 'agent:tnf-cli',
    name: options.agentName || 'TNF CLI Refresh Context',
    role: options.agentRole || 'orchestrator',
    platform: options.agentPlatform || 'tnf-cli',
    capabilities: ['context_refresh', 'orchestration'],
  };
  const snapshotId = uuidv4();
  const envelopeIds: string[] = [];
  const agentsReached: string[] = [];
  const agentsNotReached: string[] = [];

  if (!options.dryRun && client && redisAvailable) {
    try {
      for (const agent of agents) {
        const env = buildRefreshEnvelope({
          fromAgent,
          toAgentId: agent.id,
          protocolsInjected: protocolsToInject,
          agentsUpdated: agents.map((a) => a.id),
          snapshotId,
        });
        envelopeIds.push(env.id);
        try {
          await client.publish(env.to.channel, JSON.stringify(env));
          agentsReached.push(agent.id);
        } catch (err: any) {
          agentsNotReached.push(agent.id);
          degradations.push(`agent:${agent.id}:publish_failed:${err?.message ?? 'unknown'}`);
        }
      }
      const announce = buildAnnounceEnvelope(
        {
          startedAt,
          finishedAt: new Date().toISOString(),
          fromAgent: fromAgent.id,
          redis: {
            url: config.url,
            host: config.host,
            port: config.port,
            db: config.db,
            available: redisAvailable,
          },
          registryAgentCount: Object.keys(registryAgents).length,
          agentsReached: agentsReached.length,
          agentsNotReached,
          protocolsInjected: protocolsToInject,
          degraded: degradations,
          resolved: [],
          envelopeIds,
        },
        fromAgent.id
      );
      envelopeIds.push(announce.id);
      // piggyback announce id on agentsReached list as a synthetic marker
      await client.publish('tnf:bus:ingress', JSON.stringify(announce));
      try {
        const stateKey = `${REFRESH_CONTEXT_STATE_NAMESPACE}:${snapshotId}`;
        await client.set(
          stateKey,
          JSON.stringify({
            snapshotId,
            startedAt,
            finishedAt: new Date().toISOString(),
            protocolsInjected: protocolsToInject,
            agentsReached,
            agentsNotReached,
            degradations,
          })
        );
        await client.expire(stateKey, 86400);
      } catch (err: any) {
        degradations.push(`state:cache_write_failed:${err?.message ?? 'unknown'}`);
      }
    } catch (err: any) {
      degradations.push(`redis:publish_loop_failed:${err?.message ?? 'unknown'}`);
    }
  } else if (options.dryRun) {
    for (const agent of agents) {
      agentsReached.push(agent.id);
      envelopeIds.push(`dry-run:${agent.id}`);
    }
  }

  const finishedAt = new Date().toISOString();
  const newAgentsUpdated = agents.map((a) => a.id);

  const validationStatus =
    degradations.length === 0
      ? 'completed'
      : agentsReached.length === 0
        ? 'failed'
        : 'completed_with_degradations';

  const payload = {
    lastInjection: finishedAt,
    protocolsInjected: protocolsToInject,
    agentsUpdated: newAgentsUpdated,
    validationStatus,
    prunedStale: ctx.agentsUpdated.length > newAgentsUpdated.length,
    degradations,
    resolved: [],
  };

  let writtenFilePath: string;
  if (!options.dryRun) {
    writtenFilePath = await writeContextInjected(options.tnfHome, payload);
  } else {
    writtenFilePath = path.join(options.tnfHome, '.context-injected');
  }

  const diff: RefreshContextDiff = {
    startedAt,
    finishedAt,
    fromAgent: fromAgent.id,
    redis: {
      url: config.url,
      host: config.host,
      port: config.port,
      db: config.db,
      available: redisAvailable,
    },
    registryAgentCount: Object.keys(registryAgents).length,
    agentsReached: agentsReached.length,
    agentsNotReached,
    protocolsInjected: protocolsToInject,
    degraded: degradations,
    resolved: [],
    envelopeIds,
  };

  if (client) {
    try {
      await client.quit();
    } catch {
      // ignore
    }
  }

  const report: RefreshContextReport = {
    diff: cloneDiff(diff),
    before: {
      filePath: ctx.filePath,
      lastInjection: ctx.lastInjection,
      protocolsInjected: ctx.protocolsInjected,
      agentsUpdated: ctx.agentsUpdated,
    },
    after: {
      filePath: writtenFilePath,
      lastInjection: payload.lastInjection,
      protocolsInjected: payload.protocolsInjected,
      agentsUpdated: payload.agentsUpdated,
      validationStatus: payload.validationStatus,
      prunedStale: payload.prunedStale,
      degradations: payload.degradations,
      resolved: payload.resolved,
    },
    protocolContracts: Object.fromEntries(
      contracts.map((c) => [c.id, { path: c.path, contractPresent: c.contractPresent }])
    ),
    agents,
  };

  return { ok: true, report };
}

export async function runRefreshAndReport(
  options: RefreshContextOptions
): Promise<RefreshContextRunResult> {
  try {
    return await runRefreshContext(options);
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// Indirection so tests can disable the broker via redis BANNER.
export const REFRESH_CONTEXT_BROADCAST_AGENT = BROADCAST_AGENT_ID;
