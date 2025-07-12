import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../../cache/src/redis-cache.service';
export interface WebSocketMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: number;
    userId?: string;
    agentId?: string;
    priority?: MessagePriority;
    requiresAck?: boolean;
    retryCount?: number;
}
export interface BatchedMessage {
    messages: WebSocketMessage[];
    totalSize: number;
    batchId: string;
    timestamp: number;
}
export interface ConnectionMetrics {
    totalConnections: number;
    activeConnections: number;
    messagesPerSecond: number;
    averageLatency: number;
    errorRate: number;
    bandwidthUsage: number;
}
export interface ConnectionPool {
    userId: string;
    connections: Set<Socket>;
    lastActivity: number;
    messageQueue: WebSocketMessage[];
    isActive: boolean;
}
export declare enum MessagePriority {
    CRITICAL = 1,// System alerts, errors
    HIGH = 2,// Real-time agent communication
    MEDIUM = 3,// Status updates, notifications
    LOW = 4,// Analytics, logs
    BATCH = 5
}
export declare enum MessageType {
    AGENT_STATUS = "agent_status",
    WORKFLOW_UPDATE = "workflow_update",
    TASK_PROGRESS = "task_progress",
    NOTIFICATION = "notification",
    SYSTEM_ALERT = "system_alert",
    CHAT_MESSAGE = "chat_message",
    ANALYTICS_DATA = "analytics_data",
    HEARTBEAT = "heartbeat",
    BATCH_DATA = "batch_data"
}
export declare class OptimizedWebSocketService implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    private configService;
    private cacheService;
    server: Server;
    private readonly logger;
    private connectionPools;
    private messageBatches;
    private metrics;
    private readonly config;
    private batchTimers;
    private heartbeatInterval;
    private metricsInterval;
    constructor(configService: ConfigService, cacheService: RedisCacheService);
    onModuleInit(): Promise<void>;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    private authenticateConnection;
    private addToConnectionPool;
    private removeFromConnectionPool;
    private setupClientHandlers;
    private handleClientMessage;
    sendMessage(target: Socket | string, message: WebSocketMessage): Promise<boolean>;
    private sendToUser;
    private sendToSocket;
    private shouldBatchMessage;
    private addToBatch;
    private setBatchTimer;
    private flushBatch;
    broadcastToAllUsers(message: WebSocketMessage): Promise<number>;
    broadcastToAgents(agentIds: string[], message: WebSocketMessage): Promise<number>;
    private queueMessage;
    private flushMessageQueue;
    private checkRateLimit;
    private compressMessage;
    private updateConnectionActivity;
    private updateMetrics;
    private startHeartbeat;
    private startMetricsCollection;
    private startConnectionPoolCleanup;
    private collectMetrics;
    private cleanupInactivePools;
    private handleAgentCommand;
    private handleWorkflowAction;
    private handleChatMessage;
    private extractUserIdFromToken;
    private generateMessageId;
    getConnectionMetrics(): Promise<ConnectionMetrics>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=optimized-websocket.service.d.ts.map