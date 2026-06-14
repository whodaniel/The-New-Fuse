/**
 * Agent Discovery Registry Service
 *
 * Redis-based service for managing live agent discovery, heartbeats,
 * and dynamic capability registration.
 */
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
import { AgentHeartbeat, AgentRegistration, DiscoveredAgent, DiscoveryQuery, DiscoveryQueryResult } from '../types/agent-discovery.types.js';
export interface DiscoveryRegistryOptions {
    /** Redis connection options */
    redis?: {
        host?: string;
        port?: number;
        password?: string;
        db?: number;
    };
    /** Heartbeat interval in milliseconds (default: 30000) */
    heartbeatInterval?: number;
    /** Heartbeat timeout in milliseconds (default: 60000) */
    heartbeatTimeout?: number;
    /** Whether to enable pub/sub for real-time events */
    enablePubSub?: boolean;
    /** Key prefix for Redis keys */
    keyPrefix?: string;
}
export declare class AgentDiscoveryRegistry extends EventEmitter {
    private redisService;
    private options;
    private cleanupInterval?;
    private readonly AGENT_KEY_PREFIX;
    private readonly AGENT_HEARTBEAT_PREFIX;
    private readonly AGENT_METRICS_PREFIX;
    private readonly AGENT_SET_KEY;
    private readonly AGENT_CAPABILITY_INDEX;
    private readonly PUBSUB_CHANNEL;
    constructor(redisService: UnifiedRedisService, options?: DiscoveryRegistryOptions);
    /**
     * Initialize pub/sub for real-time events
     */
    private initializePubSub;
    /**
     * Register a new agent or update existing registration
     */
    registerAgent(registration: AgentRegistration): Promise<void>;
    /**
     * Index agent capabilities for fast searching
     */
    private indexCapabilities;
    /**
     * Update agent heartbeat
     */
    heartbeat(heartbeat: AgentHeartbeat): Promise<void>;
    /**
     * Deregister an agent
     */
    deregisterAgent(agentId: string): Promise<void>;
    /**
     * Remove agent from capability indexes
     */
    private removeCapabilityIndexes;
    /**
     * Query and discover agents based on criteria
     */
    discoverAgents(query?: DiscoveryQuery): Promise<DiscoveryQueryResult>;
    /**
     * Get full agent details
     */
    private getAgent;
    /**
     * Calculate agent load
     */
    private calculateLoad;
    /**
     * Get default metrics
     */
    private getDefaultMetrics;
    /**
     * Intersect agent IDs with language filter
     */
    private intersectWithLanguages;
    /**
     * Intersect agent IDs with framework filter
     */
    private intersectWithFrameworks;
    /**
     * Intersect agent IDs with group filter
     */
    private intersectWithGroups;
    /**
     * Intersect agent IDs with type filter
     */
    private intersectWithTypes;
    /**
     * Check if agent matches additional filters
     */
    private matchesFilters;
    /**
     * Calculate relevance scores for semantic search
     */
    private calculateRelevanceScores;
    /**
     * Sort agents based on query parameters
     */
    private sortAgents;
    /**
     * Generate load balancing recommendations
     */
    private generateLoadBalancingRecommendations;
    /**
     * Start cleanup job to remove stale agents
     */
    private startCleanupJob;
    /**
     * Remove agents that haven't sent heartbeat within timeout period
     */
    private cleanupStaleAgents;
    /**
     * Publish event to pub/sub channel
     */
    private publishEvent;
    /**
     * Get all registered agents
     */
    getAllAgents(): Promise<DiscoveredAgent[]>;
    /**
     * Get agent by ID
     */
    getAgentById(agentId: string): Promise<DiscoveredAgent | null>;
    /**
     * Close connections and cleanup
     */
    close(): Promise<void>;
}
//# sourceMappingURL=agent-discovery-registry.service.d.ts.map