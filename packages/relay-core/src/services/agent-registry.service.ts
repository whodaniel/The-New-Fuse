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
    };
  }

  toJSON() {
    return Object.fromEntries(this.agents);
  }
}
