import { type TnfAgentIdentityRecord } from '../contracts/identity.js';
import { type TnfAgentLifecycleStatus } from '../contracts/lifecycle.js';
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
    daccRole: 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant' | null;
    workerAction: string | null;
    traits: Record<string, unknown>;
    fulfillment: Record<string, unknown>;
    idNumber: string | null;
    mcid: string | null;
    role: string | null;
    qualities: Record<string, unknown>;
    infoRecord: Record<string, unknown>;
}
export declare function createMasterClockAgentIdentity(sourceId: string, info: any, agentId: string, ordinal: number): TnfAgentIdentityRecord;
export declare function createOrchestratorIdentity(sessionId: string): TnfAgentIdentityRecord;
export declare class AgentRegistryService {
    agents: Map<string, Agent>;
    nextAgentNumber: number;
    constructor();
    assignAgentId(sourceId: string, info?: any): string;
    recordHeartbeat(agentId: string): void;
    recordActivity(agentId: string): void;
    recordViolation(agentId: string, type: string): void;
    getAgent(agentId: string): Agent | undefined;
    getAgentBySource(sourceId: string): Agent | null;
    getStaleAgents(thresholdMs: number): Agent[];
    markOffline(agentId: string): void;
    getStats(): {
        total: number;
        active: number;
        stalled: number;
        offline: number;
        withRole: number;
        withFulfillment: number;
        withQualities: number;
        withIdNumber: number;
        withMcid: number;
    };
    toJSON(): {
        [k: string]: Agent;
    };
}
//# sourceMappingURL=agent-registry.service.d.ts.map