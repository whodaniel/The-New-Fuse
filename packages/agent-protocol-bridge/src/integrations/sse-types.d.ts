/**
 * Server-Sent Events (SSE) Integration Types
 *
 * Comprehensive type definitions for real-time server-sent events
 * integration with The New Fuse AI Agent framework.
 */
export interface SseSubscription {
    id: string;
    clientId: string;
    userId: string;
    organizationId?: string;
    eventTypes: string[];
    filters?: Record<string, any>;
    priority: SsePriority;
    connectedAt: Date;
    lastHeartbeat: Date;
    userAgent?: string;
    ipAddress?: string;
    batchSize: number;
    batchTimeout: number;
    isActive: boolean;
}
export interface SseEvent {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: Date;
    organizationId?: string;
    userId?: string;
    agentId?: string;
    source?: string;
    priority: SsePriority;
    ttl?: number;
    deliveredTo: string[];
    attempts: number;
    maxAttempts: number;
}
export interface SseConnection {
    clientId: string;
    userId?: string;
    agentId?: string;
    response: any;
    isAlive: boolean;
    connectedAt: Date;
    lastPing: Date;
    subscriptions: Set<string>;
    eventQueue: SseEvent[];
    heartbeatInterval: number;
    maxQueueSize: number;
    eventsSent: number;
    lastEventSent?: Date;
}
export declare enum SsePriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum SseEventType {
    AGENT_STATUS_CHANGED = "agent.status.changed",
    AGENT_TASK_COMPLETED = "agent.task.completed",
    AGENT_ERROR_OCCURRED = "agent.error.occurred",
    AGENT_MESSAGE_RECEIVED = "agent.message.received",
    WORKFLOW_STARTED = "workflow.started",
    WORKFLOW_COMPLETED = "workflow.completed",
    WORKFLOW_FAILED = "workflow.failed",
    WORKFLOW_STEP_COMPLETED = "workflow.step.completed",
    SYSTEM_MAINTENANCE = "system.maintenance",
    SYSTEM_UPGRADE = "system.upgrade",
    SYSTEM_ALERT = "system.alert",
    USER_NOTIFICATION = "user.notification",
    USER_SESSION_EXPIRED = "user.session.expired",
    WEBHOOK_DELIVERED = "webhook.delivered",
    N8N_WORKFLOW_TRIGGERED = "n8n.workflow.triggered",
    CUSTOM = "custom"
}
export interface SseManager {
    /**
     * Create a new SSE connection
     */
    createConnection(clientId: string, response: any, options?: {
        userId?: string;
        agentId?: string;
        heartbeatInterval?: number;
        maxQueueSize?: number;
    }): Promise<SseConnection>;
    /**
     * Close SSE connection
     */
    closeConnection(clientId: string): Promise<boolean>;
    /**
     * Subscribe to event types
     */
    subscribe(clientId: string, eventTypes: string[], filters?: Record<string, any>): Promise<SseSubscription>;
    /**
     * Unsubscribe from event types
     */
    unsubscribe(clientId: string, eventTypes?: string[]): Promise<boolean>;
    /**
     * Send event to specific client
     */
    sendToClient(clientId: string, event: Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>): Promise<boolean>;
    /**
     * Broadcast event to all matching subscribers
     */
    broadcast(event: Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>): Promise<SseBroadcastResult>;
    /**
     * Send targeted event
     */
    sendTargeted(event: Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>, targets: {
        userIds?: string[];
        agentIds?: string[];
        organizationIds?: string[];
        clientIds?: string[];
    }): Promise<SseBroadcastResult>;
    /**
     * Get active connections
     */
    getActiveConnections(filters?: {
        userId?: string;
        agentId?: string;
        organizationId?: string;
    }): Promise<SseConnection[]>;
    /**
     * Get connection metrics
     */
    getConnectionMetrics(): Promise<SseMetrics>;
    /**
     * Cleanup dead connections
     */
    cleanupConnections(): Promise<number>;
}
export interface SseBroadcastResult {
    totalTargeted: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    deliveredTo: string[];
    errors: Array<{
        clientId: string;
        error: string;
    }>;
}
export interface SseMetrics {
    totalConnections: number;
    activeConnections: number;
    totalEventsSent: number;
    eventsPerSecond: number;
    connectionsByType: {
        user: number;
        agent: number;
        system: number;
    };
    eventsByType: Record<string, number>;
    eventsByPriority: Record<SsePriority, number>;
    averageDeliveryTime: number;
    queueDepth: number;
    connectionErrors: number;
    deliveryErrors: number;
    connectionsToday: number;
    eventsToday: number;
    peakConcurrentConnections: number;
}
export interface SseEventBuilder {
    /**
     * Create agent event
     */
    createAgentEvent(agentId: string, eventType: SseEventType | string, data: Record<string, any>, options?: {
        priority?: SsePriority;
        ttl?: number;
        source?: string;
    }): Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>;
    /**
     * Create workflow event
     */
    createWorkflowEvent(workflowId: string, eventType: SseEventType | string, data: Record<string, any>, options?: {
        priority?: SsePriority;
        ttl?: number;
        agentId?: string;
        userId?: string;
    }): Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>;
    /**
     * Create user notification event
     */
    createUserNotification(userId: string, title: string, message: string, options?: {
        type?: 'info' | 'warning' | 'error' | 'success';
        priority?: SsePriority;
        actionUrl?: string;
        persistent?: boolean;
    }): Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>;
    /**
     * Create system alert
     */
    createSystemAlert(alertType: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical', options?: {
        affectedSystems?: string[];
        estimatedResolution?: Date;
        actionRequired?: boolean;
    }): Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>;
}
export interface SseMiddleware {
    /**
     * Authentication middleware
     */
    authenticate(request: any, response: any, next: Function): Promise<void>;
    /**
     * Authorization middleware
     */
    authorize(requiredPermissions: string[]): (request: any, response: any, next: Function) => Promise<void>;
    /**
     * Rate limiting middleware
     */
    rateLimit(options: {
        maxConnections?: number;
        maxEventsPerMinute?: number;
        windowMs?: number;
    }): (request: any, response: any, next: Function) => Promise<void>;
    /**
     * CORS middleware
     */
    cors(options: {
        origin?: string | string[];
        credentials?: boolean;
        headers?: string[];
    }): (request: any, response: any, next: Function) => void;
}
export interface SseFilterEngine {
    /**
     * Apply event filters
     */
    applyFilters(event: SseEvent, filters: Record<string, any>): boolean;
    /**
     * Create filter from subscription criteria
     */
    createFilter(criteria: {
        eventTypes?: string[];
        agentIds?: string[];
        userIds?: string[];
        organizationIds?: string[];
        priority?: SsePriority;
        customFilters?: Record<string, any>;
    }): Record<string, any>;
    /**
     * Validate filter syntax
     */
    validateFilter(filter: Record<string, any>): {
        isValid: boolean;
        errors: string[];
    };
}
export interface SsePersistence {
    /**
     * Save event for replay
     */
    saveEvent(event: SseEvent): Promise<void>;
    /**
     * Get events for replay
     */
    getEventsForReplay(clientId: string, since?: Date): Promise<SseEvent[]>;
    /**
     * Clean up old events
     */
    cleanupOldEvents(olderThan: Date): Promise<number>;
    /**
     * Get event history
     */
    getEventHistory(filters: {
        eventTypes?: string[];
        since?: Date;
        until?: Date;
        limit?: number;
    }): Promise<SseEvent[]>;
}
export interface SseConfiguration {
    heartbeatInterval: number;
    connectionTimeout: number;
    maxConnections: number;
    maxQueueSize: number;
    defaultPriority: SsePriority;
    maxEventSize: number;
    eventTtl: number;
    batchingEnabled: boolean;
    defaultBatchSize: number;
    defaultBatchTimeout: number;
    requireAuthentication: boolean;
    allowedOrigins: string[];
    rateLimitEnabled: boolean;
    maxEventsPerMinute: number;
    persistEvents: boolean;
    eventRetentionDays: number;
    replayEnabled: boolean;
}
//# sourceMappingURL=sse-types.d.ts.map