import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../../cache/src/redis-cache.service';
import { OptimizedQueueService } from '../../job-queue/src/optimized-queue.service';
export interface A2AMessage {
    id: string;
    fromAgent: string;
    toAgent: string;
    type: A2AMessageType;
    payload: any;
    priority: A2APriority;
    timestamp: number;
    ttl?: number;
    retryCount?: number;
    requiresResponse?: boolean;
    conversationId?: string;
    metadata?: Record<string, any>;
}
export interface A2AResponse {
    messageId: string;
    success: boolean;
    data?: any;
    error?: string;
    processingTime: number;
    agentStatus: AgentStatus;
}
export interface AgentCapabilities {
    id: string;
    type: AgentType;
    capabilities: string[];
    maxConcurrentRequests: number;
    averageResponseTime: number;
    reliability: number;
    lastSeen: number;
    isOnline: boolean;
}
export interface RoutingRule {
    messageType: A2AMessageType;
    priority: A2APriority;
    preferredAgents: string[];
    fallbackAgents: string[];
    loadBalancingStrategy: LoadBalancingStrategy;
    timeoutMs: number;
}
export declare enum A2AMessageType {
    TASK_ASSIGNMENT = "task_assignment",
    STATUS_UPDATE = "status_update",
    DATA_REQUEST = "data_request",
    DATA_RESPONSE = "data_response",
    COLLABORATION_REQUEST = "collaboration_request",
    WORKFLOW_COORDINATION = "workflow_coordination",
    RESOURCE_SHARING = "resource_sharing",
    ERROR_NOTIFICATION = "error_notification",
    HEARTBEAT = "heartbeat",
    CAPABILITY_ANNOUNCEMENT = "capability_announcement"
}
export declare enum A2APriority {
    CRITICAL = 1,// System critical, emergency responses
    HIGH = 2,// Real-time coordination, urgent tasks
    MEDIUM = 3,// Normal operations, status updates
    LOW = 4,// Background sync, analytics
    BATCH = 5
}
export declare enum AgentType {
    COORDINATOR = "coordinator",
    WORKER = "worker",
    SPECIALIST = "specialist",
    MONITOR = "monitor",
    GATEWAY = "gateway"
}
export declare enum AgentStatus {
    ONLINE = "online",
    BUSY = "busy",
    IDLE = "idle",
    OFFLINE = "offline",
    ERROR = "error"
}
export declare enum LoadBalancingStrategy {
    ROUND_ROBIN = "round_robin",
    LEAST_LOADED = "least_loaded",
    FASTEST_RESPONSE = "fastest_response",
    CAPABILITY_MATCH = "capability_match",
    GEOGRAPHIC = "geographic"
}
export declare class OptimizedA2AService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private cacheService;
    private queueService;
    private readonly logger;
    private agentRegistry;
    private activeConnections;
    private messageRoutes;
    private pendingResponses;
    private conversationContexts;
    private metrics;
    private readonly config;
    private heartbeatInterval;
    private registryCleanupInterval;
    private metricsInterval;
    constructor(configService: ConfigService, cacheService: RedisCacheService, queueService: OptimizedQueueService);
    onModuleInit(): Promise<void>;
    private initializeService;
    private initializeDefaultRoutes;
    registerAgent(agentCapabilities: AgentCapabilities): Promise<boolean>;
    unregisterAgent(agentId: string): Promise<boolean>;
    sendMessage(message: A2AMessage): Promise<A2AResponse>;
    private routeMessage;
    private findSuitableAgents;
    private canAgentHandleMessage;
    private getRequiredCapabilityForMessage;
    private selectAgentByStrategy;
    private selectRoundRobin;
    private selectLeastLoaded;
    private selectFastestResponse;
    private selectBestCapabilityMatch;
    private calculateAgentLoad;
    private getActiveRequestsForAgent;
    private optimizeMessage;
    private compressMessage;
    private sendImmediateMessage;
    private queueMessage;
    private mapA2APriorityToJobPriority;
    private sendViaWebSocket;
    private sendViaHTTP;
    broadcastMessage(message: A2AMessage): Promise<A2AResponse[]>;
    startConversation(participants: string[], context?: any): Promise<string>;
    endConversation(conversationId: string): Promise<boolean>;
    private validateMessage;
    private generateMessageId;
    private generateConversationId;
    private setupMessageProcessing;
    private loadAgentRegistry;
    private startHeartbeat;
    private sendHeartbeats;
    private startRegistryCleanup;
    private cleanupStaleAgents;
    private startMetricsCollection;
    private collectMetrics;
    getMetrics(): Promise<any>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=optimized-a2a.service.d.ts.map