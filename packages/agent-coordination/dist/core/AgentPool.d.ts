import { EventEmitter } from 'events';
import { AgentInfo, AgentStatus, AgentPoolConfig } from './types.js';
/**
 * Agent pool management
 */
export declare class AgentPool extends EventEmitter {
    private agents;
    private config;
    private heartbeatIntervals;
    constructor(config: AgentPoolConfig);
    /**
     * Register a new agent
     */
    registerAgent(agent: Partial<AgentInfo>): AgentInfo;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): boolean;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentInfo | undefined;
    /**
     * Get all agents
     */
    getAllAgents(): AgentInfo[];
    /**
     * Get agents by status
     */
    getAgentsByStatus(status: AgentStatus): AgentInfo[];
    /**
     * Get available agents (idle or not at capacity)
     */
    getAvailableAgents(): AgentInfo[];
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentStatus): boolean;
    /**
     * Update agent load
     */
    updateAgentLoad(agentId: string, load: number): boolean;
    /**
     * Increment agent load
     */
    incrementAgentLoad(agentId: string): boolean;
    /**
     * Decrement agent load
     */
    decrementAgentLoad(agentId: string): boolean;
    /**
     * Update agent heartbeat
     */
    heartbeat(agentId: string): boolean;
    /**
     * Setup heartbeat monitoring for an agent
     */
    private setupHeartbeatMonitoring;
    /**
     * Clear heartbeat monitoring for an agent
     */
    private clearHeartbeatMonitoring;
    /**
     * Check if agent heartbeat is healthy
     */
    private checkAgentHeartbeat;
    /**
     * Get pool statistics
     */
    getStatistics(): {
        totalAgents: number;
        idleAgents: number;
        busyAgents: number;
        offlineAgents: number;
        totalCapacity: number;
        usedCapacity: number;
        utilizationRate: number;
    };
    /**
     * Auto-scale the agent pool based on load
     */
    autoScale(): {
        action: 'scale-up' | 'scale-down' | 'none';
        reason: string;
    };
    /**
     * Close the agent pool
     */
    close(): void;
}
//# sourceMappingURL=AgentPool.d.ts.map