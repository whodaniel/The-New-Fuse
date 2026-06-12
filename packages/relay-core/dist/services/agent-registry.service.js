"use strict";
// packages/relay-core/src/services/agent-registry.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistryService = void 0;
exports.createMasterClockAgentIdentity = createMasterClockAgentIdentity;
exports.createOrchestratorIdentity = createOrchestratorIdentity;
const identity_js_1 = require("../contracts/identity.js");
const lifecycle_js_1 = require("../contracts/lifecycle.js");
function createMasterClockAgentIdentity(sourceId, info, agentId, ordinal) {
    let canonicalEntityId = typeof info?.canonicalEntityId === 'string' ? info.canonicalEntityId : null;
    if (!canonicalEntityId) {
        try {
            canonicalEntityId = (0, identity_js_1.buildCanonicalEntityId)({
                category: 'AGENT',
                provider: typeof info?.platform === 'string' && info.platform.trim() ? info.platform : 'unknown',
                name: typeof info?.name === 'string' && info.name.trim() ? info.name : sourceId || agentId,
                instance: ordinal,
            });
        }
        catch {
            canonicalEntityId = null;
        }
    }
    return (0, identity_js_1.createAgentIdentityRecord)({
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
function createOrchestratorIdentity(sessionId) {
    let canonicalEntityId = null;
    try {
        canonicalEntityId = (0, identity_js_1.buildCanonicalEntityId)({
            category: 'AGENT',
            provider: 'TNF',
            name: 'MASTER_CLOCK',
            instance: 1,
        });
    }
    catch {
        canonicalEntityId = null;
    }
    return (0, identity_js_1.createAgentIdentityRecord)({
        canonicalEntityId,
        operationalHandle: 'ORCHESTRATOR',
        runtimeSessionId: sessionId,
        aliases: [sessionId, 'master-clock', 'tnf-master-clock'],
    });
}
class AgentRegistryService {
    // pendingOnboarding: Map<string, any>; // This responsibility might belong to MasterClock orchestration
    constructor() {
        this.agents = new Map();
        this.nextAgentNumber = 1;
        // this.pendingOnboarding = new Map();
    }
    assignAgentId(sourceId, info = {}) {
        // Check if already assigned
        for (const [id, agent] of this.agents) {
            if (agent.sourceId === sourceId) {
                return agent.agentId;
            }
        }
        // Generate new ID
        const agentNum = String(this.nextAgentNumber++).padStart(2, '0');
        const agentId = `AGENT-${agentNum}`;
        const identity = createMasterClockAgentIdentity(sourceId, info, agentId, this.nextAgentNumber - 1);
        const agent = {
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
            status: (0, lifecycle_js_1.normalizeAgentLifecycleStatus)('active') || 'active',
            messageCount: 0,
            violations: 0,
            channel: info.channel || null,
        };
        this.agents.set(agentId, agent);
        console.log(`[INFO] [REGISTRY] Assigned ${agentId} to ${sourceId}`); // Temporary logging
        return agentId;
    }
    recordHeartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastHeartbeat = Date.now();
            agent.status = (0, lifecycle_js_1.normalizeAgentLifecycleStatus)('active') || 'active';
        }
    }
    recordActivity(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastActivity = Date.now();
            agent.messageCount++;
            agent.status = (0, lifecycle_js_1.normalizeAgentLifecycleStatus)('active') || 'active';
        }
    }
    recordViolation(agentId, type) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.violations++;
            console.warn(`[WARN] [REGISTRY] Violation recorded for ${agentId}: ${type}`); // Temporary logging
        }
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    getAgentBySource(sourceId) {
        for (const [_, agent] of this.agents) {
            if (agent.sourceId === sourceId) {
                return agent;
            }
        }
        return null;
    }
    getStaleAgents(thresholdMs) {
        const now = Date.now();
        const stale = [];
        for (const [id, agent] of this.agents) {
            if (agent.status !== 'offline' && now - agent.lastHeartbeat > thresholdMs) {
                stale.push(agent);
            }
        }
        return stale;
    }
    markOffline(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = (0, lifecycle_js_1.normalizeAgentLifecycleStatus)('offline') || 'offline';
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
exports.AgentRegistryService = AgentRegistryService;
//# sourceMappingURL=agent-registry.service.js.map