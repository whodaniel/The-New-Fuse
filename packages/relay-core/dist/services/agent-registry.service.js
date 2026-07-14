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
    constructor() {
        this.REGISTRATION_COOLDOWN_MS = 2000; // 2 seconds between registration requests for the same sourceId
        this.MAX_TOTAL_AGENTS = 500; // Hard cap on total registered agents in memory
        this.agents = new Map();
        this.nextAgentNumber = 1;
        this.registrationTimestamps = new Map();
        // this.pendingOnboarding = new Map();
    }
    assignAgentId(sourceId, info = {}) {
        const now = Date.now();
        const lastAttempt = this.registrationTimestamps.get(sourceId);
        if (lastAttempt && now - lastAttempt < this.REGISTRATION_COOLDOWN_MS) {
            throw new Error(`Rate limit exceeded: Registration attempt for sourceId "${sourceId}" was made too quickly (minimum interval is ${this.REGISTRATION_COOLDOWN_MS}ms).`);
        }
        this.registrationTimestamps.set(sourceId, now);
        // Check if already assigned
        for (const [id, agent] of this.agents) {
            if (agent.sourceId === sourceId) {
                return agent.agentId;
            }
        }
        // DoS Protection: check max agents
        if (this.agents.size >= this.MAX_TOTAL_AGENTS) {
            throw new Error(`Denial of service protection: Maximum active agents limit (${this.MAX_TOTAL_AGENTS}) reached. Cannot register sourceId "${sourceId}".`);
        }
        // Generate new ID
        const agentNum = String(this.nextAgentNumber++).padStart(2, '0');
        const agentId = `AGENT-${agentNum}`;
        const identity = createMasterClockAgentIdentity(sourceId, info, agentId, this.nextAgentNumber - 1);
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
        const daccRole = incomingDaccRole && VALID_DACC_ROLES.has(incomingDaccRole)
            ? incomingDaccRole
            : null;
        // Default daccRole to 'worker' for any agent that doesn't explicitly
        // declare. 'orchestrator' and 'broker' are explicit promotions, never
        // inferred — they require elevated authority per DACC-v1.
        const effectiveDaccRole = daccRole ?? 'worker';
        const traits = info.traits && typeof info.traits === 'object' && !Array.isArray(info.traits)
            ? info.traits
            : info.qualities && typeof info.qualities === 'object' && !Array.isArray(info.qualities)
                ? info.qualities
                : {};
        const fulfillment = info.fulfillment && typeof info.fulfillment === 'object' && !Array.isArray(info.fulfillment)
            ? info.fulfillment
            : {};
        const workerAction = incomingWorkerAction ?? incomingRole ?? null;
        // Phase 9 FOLLOWUP-2/3: pull federated IDs from the upstream payload.
        // The bridge emits them deterministically; if absent we leave null.
        const incomingIdNumber = typeof info.idNumber === 'string' && /^ID#:[1-9A-HJ-NP-Za-km-z]+$/.test(info.idNumber)
            ? info.idNumber
            : null;
        const incomingMcid = typeof info.mcid === 'string' && info.mcid.trim() ? info.mcid : null;
        const incomingCanonical = typeof info.canonicalEntityId === 'string' && info.canonicalEntityId.trim()
            ? info.canonicalEntityId
            : null;
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
            infoRecord: info && typeof info === 'object' && !Array.isArray(info)
                ? { ...info }
                : {},
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
            withIdNumber: agents.filter((a) => typeof a.idNumber === 'string' && a.idNumber.startsWith('ID#:')).length,
            withMcid: agents.filter((a) => typeof a.mcid === 'string' && a.mcid.length > 0).length,
        };
    }
    toJSON() {
        return Object.fromEntries(this.agents);
    }
}
exports.AgentRegistryService = AgentRegistryService;
//# sourceMappingURL=agent-registry.service.js.map