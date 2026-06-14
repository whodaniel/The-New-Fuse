import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { A2APriority, AgentStatus } from '@the-new-fuse/a2a-core';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { PersistentMetricsCollector, SystemMetrics } from './monitoring/PersistentMetricsCollector.js';
import { AgentTask, CoordinationEvent, CoordinationMetrics, EventListener, MessageHandler, QueueConfig, RedisCoordinatorConfig, SharedState, TaskProcessor } from './types/coordination.types';
/**
 * Redis-based agent coordination system
 *
 * Provides comprehensive agent-to-agent communication and coordination:
 * - Pub/sub channels for real-time messaging
 * - Task distribution with BullMQ
 * - Agent presence tracking with heartbeat system
 * - Shared state management with optimistic locking
 * - Broadcast messaging for multi-agent coordination
 * - Persistent metrics and failure recovery
 */
export declare class RedisCoordinator implements OnModuleInit, OnModuleDestroy {
    private readonly redisService;
    private readonly config;
    private readonly logger;
    private readonly keyPrefix;
    private readonly serializer;
    private readonly presenceTracker;
    private taskQueueManager;
    private readonly broadcastManager;
    private readonly sharedStateManager;
    private metricsCollector;
    private recoveryManager;
    private readonly eventListeners;
    private metrics;
    constructor(redisService: UnifiedRedisService, config?: RedisCoordinatorConfig);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Register agent with coordination system
     */
    registerAgent(agentId: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Unregister agent from coordination system
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>;
    /**
     * Check if agent is online
     */
    isAgentOnline(agentId: string): Promise<boolean>;
    /**
     * Get all active agents
     */
    getActiveAgents(): Promise<string[]>;
    /**
     * Send direct message to agent
     */
    sendDirectMessage(fromAgent: string, toAgent: string, payload: any, options?: {
        priority?: A2APriority;
        timeout?: number;
        requiresResponse?: boolean;
    }): Promise<void>;
    /**
     * Subscribe to direct messages
     */
    subscribeToDirectMessages(agentId: string, handler: MessageHandler): Promise<void>;
    /**
     * Broadcast message to all agents
     */
    broadcast(fromAgent: string, payload: any, options?: {
        topic?: string;
        priority?: A2APriority;
        ttl?: number;
    }): Promise<void>;
    /**
     * Subscribe to broadcast messages
     */
    subscribeToBroadcast(handler: MessageHandler, topic?: string): Promise<void>;
    /**
     * Create and assign task to agent
     */
    createTask(task: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<AgentTask>;
    /**
     * Register task processor
     */
    registerTaskProcessor(taskType: string, processor: TaskProcessor, config?: Partial<QueueConfig>): Promise<void>;
    /**
     * Get task status
     */
    getTaskStatus(taskId: string): Promise<AgentTask | null>;
    /**
     * Cancel task
     */
    cancelTask(taskId: string): Promise<boolean>;
    /**
     * Set shared state
     */
    setSharedState(key: string, value: any, ownerId: string, ttl?: number): Promise<SharedState>;
    /**
     * Get shared state
     */
    getSharedState(key: string): Promise<SharedState | null>;
    /**
     * Update shared state with locking
     */
    updateSharedState(key: string, updater: (currentValue: any) => any, ownerId: string): Promise<SharedState | null>;
    /**
     * Acquire lock on shared state
     */
    acquireStateLock(key: string, agentId: string, ttl?: number): Promise<import("./types/coordination.types").StateLock | null>;
    /**
     * Release lock on shared state
     */
    releaseStateLock(key: string, lockId: string): Promise<boolean>;
    /**
     * Subscribe to coordination events
     */
    subscribeToEvents(eventType: string, listener: EventListener): Promise<void>;
    /**
     * Publish coordination event
     */
    publishEvent(event: CoordinationEvent): Promise<void>;
    /**
     * Get coordination metrics (legacy)
     */
    getMetrics(): CoordinationMetrics;
    /**
     * Get detailed persistent metrics
     */
    getDetailedMetrics(): Promise<SystemMetrics>;
    /**
     * Get queue statistics
     */
    getQueueStats(queueName?: string): Promise<any>;
    /**
     * Setup event channels
     */
    private setupEventChannels;
    /**
     * Setup presence channels
     */
    private setupPresenceChannels;
    /**
     * Handle agent offline event
     */
    private handleAgentOffline;
    /**
     * Access to metrics collector for internal use
     */
    getMetricsCollector(): PersistentMetricsCollector;
}
//# sourceMappingURL=redis-coordinator.d.ts.map