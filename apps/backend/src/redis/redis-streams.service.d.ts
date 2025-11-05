/**
 * Redis Streams Service
 * Provides real-time communication and event streaming for multi-agent systems
 * Handles message queuing, pub/sub, and stream processing for The New Fuse
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface StreamMessage {
    id: string;
    agencyId: string;
    agentId: string;
    type: 'command' | 'response' | 'event' | 'heartbeat' | 'notification';
    payload: Record<string, unknown>;
    timestamp: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    metadata?: {
        correlationId?: string;
        replyTo?: string;
        ttl?: number;
        retryCount?: number;
    };
}
export interface StreamConsumerConfig {
    groupName: string;
    consumerName: string;
    streamKey: string;
    batchSize?: number;
    blockTime?: number;
    startFrom?: string;
}
export interface StreamStats {
    streamKey: string;
    length: number;
    lastGeneratedId: string;
    groups: Array<{
        name: string;
        consumers: number;
        pending: number;
        lastDeliveredId: string;
    }>;
    messagesPerSecond: number;
    totalProcessed: number;
    errors: number;
}
export declare class RedisStreamsService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly eventEmitter;
    private readonly logger;
    private redis;
    private subscriber;
    private consumers;
    private streamStats;
    private messageHandlers;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Initialize Redis connections for streams and pub/sub
     */
    private initializeRedisConnections;
    /**
     * Setup default streams for the application
     */
    private setupDefaultStreams;
    /**
     * Publish a message to a Redis stream
     */
    publishToStream(streamKey: string, message: Omit<StreamMessage, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Start consuming messages from a stream
     */
    startConsumer(config: StreamConsumerConfig, handler: (message: StreamMessage) => Promise<void>): Promise<void>;
    /**
     * Stop a consumer
     */
    stopConsumer(streamKey: string, groupName: string, consumerName: string): Promise<void>;
    /**
     * Consume messages from a stream
     */
    private consumeMessages;
    /**
     * Process messages from a stream
     */
    private processStreamMessages;
    /**
     * Parse message fields from Redis stream
     */
    private parseMessageFields;
    /**
     * Handle failed message processing
     */
    private handleFailedMessage;
    /**
     * Publish a notification to all agency members
     */
    publishNotification(agencyId: string, notification: {
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Send a command to a specific agent
     */
    sendCommandToAgent(agencyId: string, agentId: string, command: {
        action: string;
        parameters?: Record<string, unknown>;
        timeout?: number;
    }): Promise<string>;
    /**
     * Broadcast event to all agents in an agency
     */
    broadcastEvent(agencyId: string, event: {
        type: string;
        data: Record<string, unknown>;
        source?: string;
    }): Promise<string>;
    /**
     * Get statistics for a stream
     */
    getStreamStats(streamKey: string): Promise<StreamStats | null>;
    /**
     * Update stream statistics
     */
    private updateStreamStats;
    /**
     * Start collecting statistics
     */
    private startStatsCollection;
    /**
     * Calculate message rates per second
     */
    private calculateMessageRates;
    /**
     * Generate a unique message ID
     */
    private generateMessageId;
    /**
     * Close Redis connections
     */
    private closeConnections;
    /**
     * Utility sleep function
     */
    private sleep;
}
//# sourceMappingURL=redis-streams.service.d.ts.map