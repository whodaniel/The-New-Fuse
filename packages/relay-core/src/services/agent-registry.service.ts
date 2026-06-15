// packages/relay-core/src/services/agent-registry.service.ts

import {
  buildCanonicalEntityId,
  createAgentIdentityRecord,
  type TnfAgentIdentityRecord,
} from '../contracts/identity.js';
import {
  normalizeAgentLifecycleStatus,
  type TnfAgentLifecycleStatus,
} from '../contracts/lifecycle.js';

// NOTE: Logging will need to be properly injected or handled by a shared module
// For now, console.log is used as a temporary placeholder for demonstration or commented out.
// The MasterClock will be responsible for orchestrating higher-level logging.

export interface Agent {
  agentId: string;
  sourceId: string;
  canonicalEntityId?: string | null;
  operationalHandle: string;
  runtimeSessionId?: string | null;
  aliases: string[];
  platform: string;
  name: string;
  capabilities: string[];
  registeredAt: number;
  lastHeartbeat: number;
  lastActivity: number;
  status: TnfAgentLifecycleStatus;
  messageCount: number;
  violations: number;
  channel: string | null;
  // Phase 8 (audit 2026-06-14, consistency review): align field names with
  // the canonical runtime vocabulary surfaced by `tnf traits list` and
  // DACC-v1 ROLE_DEFINITIONS. The previous shape used `role` and `qualities`;
  // we now expose `daccRole`, `workerAction`, and `traits`.
  //
  // `daccRole` is the DACC-v1 hierarchy position ('director' | 'orchestrator'
  // | 'broker' | 'worker' | 'participant'). Defaults to 'worker' for
  // backward compatibility.
  // `workerAction` is the AgentRole action primitive (e.g. 'code_generation',
  // 'orchestrator', 'cli_coder'). This is what `role` used to mean.
  daccRole: 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant' | null;
  workerAction: string | null;
  // `traits` (formerly `qualities`) is the canonical term-of-art used by
  // `tnf traits list` and AGENT_PLATFORM_TRAITS / AGENT_ROLE_TRAITS arrays.
  traits: Record<string, unknown>;
  fulfillment: Record<string, unknown>;
  // Phase 9 (audit 2026-06-14, federated ID encoding): three federated
  // identity namespaces. Now first-class on the agent shape (mirrored onto
  // the bridging payload emitted by agent-registry-bridge).
  idNumber: string | null;
  mcid: string | null;
  // The legacy field is preserved on the type for backward compatibility
  // with any consumer still reading `agent.role`/`agent.qualities`. We
  // populate it from the new fields above; it is now a computed alias.
  // @deprecated use `workerAction` instead.
  role: string | null;
  // @deprecated use `traits` instead.
  qualities: Record<string, unknown>;
  // Phase 2: the full info payload is preserved (read-only) so we can audit
  // and migrate later without losing upstream-supplied fields.
  infoRecord: Record<string, unknown>;
}

export function createMasterClockAgentIdentity(
  sourceId: string,
  info: any,
  agentId: string,
  ordinal: number
): TnfAgentIdentityRecord {
  let canonicalEntityId =
    typeof info?.canonicalEntityId === 'string' ? info.canonicalEntityId : null;

  if (!canonicalEntityId) {
    try {
      canonicalEntityId = buildCanonicalEntityId({
        category: 'AGENT',
        provider:
          typeof info?.platform === 'string' && info.platform.trim() ? info.platform : 'unknown',
        name: typeof info?.name === 'string' && info.name.trim() ? info.name : sourceId || agentId,
        instance: ordinal,
      });
    } catch {
      canonicalEntityId = null;
    }
  }

  return createAgentIdentityRecord({
    canonicalEntityId,
    operationalHandle: agentId,
    runtimeSessionId: sourceId,
    aliases: [
      sourceId,
      typeof info?.name === 'string' ? info.name : null,
      typeof info?.operationalHandle === 'string' ? info.operationalHandle : null,
      ...(Array.isArray(info?.aliases) ? info.aliases : []),
    ],
  });
}

export function createOrchestratorIdentity(sessionId: string): TnfAgentIdentityRecord {
  let canonicalEntityId: string | null = null;
  try {
    canonicalEntityId = buildCanonicalEntityId({
      category: 'AGENT',
      provider: 'TNF',
      name: 'MASTER_CLOCK',
      instance: 1,
    });
  } catch {
    canonicalEntityId = null;
  }

  return createAgentIdentityRecord({
    canonicalEntityId,
    operationalHandle: 'ORCHESTRATOR',
    runtimeSessionId: sessionId,
    aliases: [sessionId, 'master-clock', 'tnf-master-clock'],
  });
}

export class AgentRegistryService {
  agents: Map<string, Agent>;
  nextAgentNumber: number;
  // pendingOnboarding: Map<string, any>; // This responsibility might belong to MasterClock orchestration

  constructor() {
    this.agents = new Map();
    this.nextAgentNumber = 1;
    // this.pendingOnboarding = new Map();
  }

  assignAgentId(sourceId: string, info: any = {}): string {
    // Check if already assigned
    for (const [id, agent] of this.agents) {
      if (agent.sourceId === sourceId) {
        return agent.agentId;
      }
    }

    // Generate new ID
    const agentNum = String(this.nextAgentNumber++).padStart(2, '0');
    const agentId = `AGENT-${agentNum}`;
    const identity = createMasterClockAgentIdentity(
      sourceId,
      info,
      agentId,
      this.nextAgentNumber - 1
    );

    // Phase 8: parse the new axes from incoming `info` payload. We accept
    // both new names (daccRole, workerAction, traits) and old names (role,
    // qualities) for backward compatibility; new names win when both supplied.
    const VALID_DACC_ROLES = new Set([
      'director',
      'orchestrator',
      'broker',
      'worker',
      'participant',
    ]);
    const incomingDaccRole = typeof info.daccRole === 'string' ? info.daccRole : null;
    const incomingWorkerAction = typeof info.workerAction === 'string' ? info.workerAction : null;
    const incomingRole = typeof info.role === 'string' && info.role.trim() ? info.role : null;
    const daccRole =
      incomingDaccRole && VALID_DACC_ROLES.has(incomingDaccRole)
        ? (incomingDaccRole as 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant')
        : null;
    // Default daccRole to 'worker' for any agent that doesn't explicitly
    // declare. 'orchestrator' and 'broker' are explicit promotions, never
    // inferred — they require elevated authority per DACC-v1.
    const effectiveDaccRole: 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant' =
      daccRole ?? 'worker';
    const traits =
      info.traits && typeof info.traits === 'object' && !Array.isArray(info.traits)
        ? (info.traits as Record<string, unknown>)
        : info.qualities && typeof info.qualities === 'object' && !Array.isArray(info.qualities)
          ? (info.qualities as Record<string, unknown>)
          : {};
    const fulfillment =
      info.fulfillment && typeof info.fulfillment === 'object' && !Array.isArray(info.fulfillment)
        ? (info.fulfillment as Record<string, unknown>)
        : {};
    const workerAction = incomingWorkerAction ?? incomingRole ?? null;
    // Phase 9 FOLLOWUP-2/3: pull federated IDs from the upstream payload.
    // The bridge emits them deterministically; if absent we leave null.
    const incomingIdNumber =
      typeof info.idNumber === 'string' && /^ID#:[1-9A-HJ-NP-Za-km-z]+$/.test(info.idNumber)
        ? info.idNumber
        : null;
    const incomingMcid = typeof info.mcid === 'string' && info.mcid.trim() ? info.mcid : null;
    const incomingCanonical =
      typeof info.canonicalEntityId === 'string' && info.canonicalEntityId.trim()
        ? info.canonicalEntityId
        : null;

    const agent: Agent = {
      agentId,
      sourceId,
      canonicalEntityId: identity.canonicalEntityId,
      operationalHandle: identity.operationalHandle,
      runtimeSessionId: identity.runtimeSessionId,
      aliases: identity.aliases,
      platform: info.platform || 'unknown',
      name: info.name || `Agent ${agentNum}`,
      capabilities: info.capabilities || [],
      registeredAt: Date.now(),
      lastHeartbeat: Date.now(),
      lastActivity: Date.now(),
      status: normalizeAgentLifecycleStatus('active') || 'active',
      messageCount: 0,
      violations: 0,
      channel: info.channel || null,
      // Phase 8 canonical fields
      daccRole: effectiveDaccRole,
      workerAction,
      traits,
      fulfillment,
      // Phase 9 federated IDs (FOLLOWUP-2 + FOLLOWUP-3): round-trip from
      // upstream payload. canonicalEntityId is preserved through `identity`
      // which is built via normalizeCanonicalEntityId.
      idNumber: incomingIdNumber,
      mcid: incomingMcid,
      // Phase 8 deprecated aliases (populated for any consumer still reading
      // the old field names). Eventually remove once `info.role` and
      // `info.qualities` are fully retired from upstream emitters.
      role: workerAction,
      qualities: traits,
      // Phase 2: preserve the full info payload (read-only) so we don't lose
      // any future fields from upstream. This makes Phase 3+ upgrades possible
      // without schema migrations.
      infoRecord:
        info && typeof info === 'object' && !Array.isArray(info)
          ? { ...(info as Record<string, unknown>) }
          : {},
    };

    this.agents.set(agentId, agent);
    console.log(`[INFO] [REGISTRY] Assigned ${agentId} to ${sourceId}`); // Temporary logging

    return agentId;
  }

  recordHeartbeat(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = Date.now();
      agent.status = normalizeAgentLifecycleStatus('active') || 'active';
    }
  }

  recordActivity(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastActivity = Date.now();
      agent.messageCount++;
      agent.status = normalizeAgentLifecycleStatus('active') || 'active';
    }
  }

  recordViolation(agentId: string, type: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.violations++;
      console.warn(`[WARN] [REGISTRY] Violation recorded for ${agentId}: ${type}`); // Temporary logging
    }
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAgentBySource(sourceId: string): Agent | null {
    for (const [_, agent] of this.agents) {
      if (agent.sourceId === sourceId) {
        return agent;
      }
    }
    return null;
  }

  getStaleAgents(thresholdMs: number): Agent[] {
    const now = Date.now();
    const stale: Agent[] = [];
    for (const [id, agent] of this.agents) {
      if (agent.status !== 'offline' && now - agent.lastHeartbeat > thresholdMs) {
        stale.push(agent);
      }
    }
    return stale;
  }

  markOffline(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = normalizeAgentLifecycleStatus('offline') || 'offline';
      console.warn(`[WARN] [REGISTRY] Agent marked offline: ${agentId}`); // Temporary logging
    }
  }

  getStats() {
    const agents = Array.from(this.agents.values());
    return {
      total: agents.length,
      active: agents.filter((a) => a.status === 'active').length,
      stalled: agents.filter((a) => a.status === 'stalled').length,
      offline: agents.filter((a) => a.status === 'offline').length,
      // Phase 2 (audit 2026-06-14): role+fulfillment coverage so operators
      // can see how much of the fleet has actually been re-classified.
      withRole: agents.filter((a) => typeof a.role === 'string' && a.role.length > 0).length,
      withFulfillment: agents.filter((a) => a.fulfillment && Object.keys(a.fulfillment).length > 0)
        .length,
      withQualities: agents.filter((a) => a.qualities && Object.keys(a.qualities).length > 0)
        .length,
      // Phase 9 federated ID coverage (FOLLOWUP-2/3): ensures the registry
      // is reporting the percentage of agents that have a populated ID# and
      // mcid envelope. Operators can spot gaps that indicate the bridge
      // route is broken for a given agent.
      withIdNumber: agents.filter(
        (a) => typeof a.idNumber === 'string' && a.idNumber.startsWith('ID#:')
      ).length,
      withMcid: agents.filter((a) => typeof a.mcid === 'string' && a.mcid.length > 0).length,
    };
  }

  toJSON() {
    return Object.fromEntries(this.agents);
  }
}
