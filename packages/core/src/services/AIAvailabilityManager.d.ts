import EventEmitter from 'events';
export type AgentId = string;
export type AgentInfo = {
    id: AgentId;
    name?: string;
    type?: string;
    capabilities?: string[];
    lastSeen: number;
    metadata?: Record<string, unknown>;
    score?: number;
};
export type TaskRequest = {
    id: string;
    type: string;
    payload?: unknown;
    constraints?: Record<string, unknown>;
};
/**
 * AIAvailabilityManager
 * - keeps an in-memory registry of available agents
 * - receives registration + heartbeat signals
 * - provides a simple scoring function and assignment API
 */
export declare class AIAvailabilityManager extends EventEmitter {
    private agents;
    private heartbeatTTL;
    constructor(opts?: {
        heartbeatTTL?: number;
    });
    registerAgent(info: Omit<AgentInfo, 'lastSeen'>): AgentInfo;
    handleHeartbeat(agentId: AgentId, metadata?: Partial<AgentInfo>): AgentInfo;
    pruneStale(): AgentInfo[];
    listAgents(): AgentInfo[];
    private scoreAgent;
    findBestAgentForTask(task: TaskRequest): {
        agent: AgentInfo;
        score: number;
    } | null;
    assignTask(task: TaskRequest): AgentInfo | null;
}
export default AIAvailabilityManager;
//# sourceMappingURL=AIAvailabilityManager.d.ts.map