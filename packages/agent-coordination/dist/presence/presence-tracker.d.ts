import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { AgentStatus } from '@the-new-fuse/a2a-core';
import { AgentPresence } from '../types/coordination.types';
import { MessageSerializer } from '../serializers/message-serializer.js';
/**
 * Agent presence tracker with heartbeat system
 */
export declare class PresenceTracker {
    private readonly redisService;
    private readonly config;
    private readonly logger;
    private readonly keyPrefix;
    private readonly heartbeatInterval;
    private readonly heartbeatTimeout;
    private readonly serializer;
    private heartbeatTimers;
    private monitorInterval?;
    constructor(redisService: UnifiedRedisService, config: {
        keyPrefix?: string;
        heartbeatInterval?: number;
        heartbeatTimeout?: number;
    }, serializer: MessageSerializer);
    /**
     * Register agent presence
     */
    registerAgent(agentId: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Unregister agent presence
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Update agent status
     */
    updateStatus(agentId: string, status: AgentStatus): Promise<void>;
    /**
     * Get agent presence
     */
    getPresence(agentId: string): Promise<AgentPresence | null>;
    /**
     * Get all active agents
     */
    getActiveAgents(): Promise<AgentPresence[]>;
    /**
     * Check if agent is online
     */
    isOnline(agentId: string): Promise<boolean>;
    /**
     * Start monitoring for stale agents
     */
    startMonitoring(): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Update agent presence
     */
    private updatePresence;
    /**
     * Start heartbeat for agent
     */
    private startHeartbeat;
    /**
     * Stop heartbeat for agent
     */
    private stopHeartbeat;
    /**
     * Check if agent is alive based on heartbeat
     */
    private isAgentAlive;
    /**
     * Check for stale agents and mark them offline
     */
    private checkStaleAgents;
    /**
     * Publish presence event
     */
    private publishPresenceEvent;
}
//# sourceMappingURL=presence-tracker.d.ts.map