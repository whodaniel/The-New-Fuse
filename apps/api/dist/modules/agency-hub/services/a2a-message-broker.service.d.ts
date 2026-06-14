import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
/**
 * A2A Message Types
 */
export declare enum A2AMessageType {
    DIRECT_MESSAGE = "DIRECT_MESSAGE",
    BROADCAST = "BROADCAST",
    TASK_ASSIGNED = "TASK_ASSIGNED",
    TASK_COMPLETED = "TASK_COMPLETED",
    TASK_FAILED = "TASK_FAILED",
    TASK_PROGRESS = "TASK_PROGRESS",
    AGENT_ONLINE = "AGENT_ONLINE",
    AGENT_OFFLINE = "AGENT_OFFLINE",
    HEARTBEAT = "HEARTBEAT",
    CONVERSATION_START = "CONVERSATION_START",
    CONVERSATION_MESSAGE = "CONVERSATION_MESSAGE",
    CONVERSATION_END = "CONVERSATION_END",
    PROMPT_UPDATE_REQUEST = "PROMPT_UPDATE_REQUEST",
    PROMPT_UPDATED = "PROMPT_UPDATED",
    CAPABILITY_ANNOUNCEMENT = "CAPABILITY_ANNOUNCEMENT"
}
export declare enum A2APriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface A2AMessage {
    id: string;
    type: A2AMessageType;
    from: string;
    to: string | 'broadcast';
    payload: any;
    priority: A2APriority;
    timestamp: Date;
    correlationId?: string;
    replyTo?: string;
    ttl?: number;
    metadata?: Record<string, any>;
}
export interface A2AChannel {
    id: string;
    name: string;
    participants: string[];
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
}
export interface A2ASubscription {
    agentId: string;
    channel: string;
    handler: (message: A2AMessage) => Promise<void>;
    filters?: {
        types?: A2AMessageType[];
        fromAgents?: string[];
        priority?: A2APriority[];
    };
}
/**
 * A2A Message Broker Service
 *
 * The third pillar of the TNF Agent system:
 * 1. Orchestrator - Task management and swarm coordination
 * 2. Heartbeat - Chronological routines and health monitoring
 * 3. Message Broker - Inter-agent communication (THIS SERVICE)
 *
 * Provides:
 * - Direct agent-to-agent messaging
 * - Broadcast messaging
 * - Channel-based pub/sub
 * - Message routing and filtering
 * - Conversation management
 * - Event-driven communication
 */
export declare class A2AMessageBrokerService implements OnModuleInit, OnModuleDestroy {
    private readonly eventEmitter;
    private readonly configService;
    private readonly logger;
    private redis;
    private redisReady;
    private readonly redisPrefix;
    private readonly defaultMessageTtlMs;
    private readonly heartbeatTtlMs;
    private readonly stallTimeoutMs;
    private localGlobalSequence;
    private localConversationSequences;
    private agentStallState;
    private messageQueues;
    private channels;
    private subscriptions;
    private agentPresence;
    private metrics;
    constructor(eventEmitter: EventEmitter2, configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Send a direct message from one agent to another
     */
    sendMessage(message: Omit<A2AMessage, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Deliver a direct message to a specific agent
     */
    private deliverDirectMessage;
    /**
     * Broadcast a message to all subscribed agents
     */
    private broadcastMessage;
    /**
     * Check if a message matches subscription filters
     */
    private matchesFilters;
    /**
     * Subscribe an agent to receive messages
     */
    subscribe(subscription: Omit<A2ASubscription, 'handler'> & {
        handler: (message: A2AMessage) => Promise<void>;
    }): Promise<string>;
    /**
     * Unsubscribe an agent from a channel
     */
    unsubscribe(agentId: string, channel: string): Promise<void>;
    /**
     * Create a new communication channel
     */
    createChannel(name: string, initialParticipants?: string[]): Promise<A2AChannel>;
    /**
     * Send a message to a specific channel
     */
    sendToChannel(channelName: string, message: Omit<A2AMessage, 'id' | 'timestamp' | 'to'>): Promise<string>;
    /**
     * Join an existing channel
     */
    joinChannel(agentId: string, channelName: string): Promise<void>;
    /**
     * Leave a channel
     */
    leaveChannel(agentId: string, channelName: string): Promise<void>;
    /**
     * Get pending messages for an agent
     */
    getPendingMessages(agentId: string, limit?: number): Promise<A2AMessage[]>;
    /**
     * Peek at pending messages without removing them
     */
    peekMessages(agentId: string, limit?: number): Promise<A2AMessage[]>;
    /**
     * Start a conversation between agents
     */
    startConversation(initiatorId: string, participantIds: string[], topic?: string): Promise<string>;
    /**
     * Send a message in a conversation
     */
    sendConversationMessage(conversationId: string, fromAgent: string, content: any): Promise<string>;
    /**
     * Register agent as online
     */
    registerPresence(agentId: string): Promise<void>;
    /**
     * Unregister agent (mark as offline)
     */
    unregisterPresence(agentId: string): Promise<void>;
    /**
     * Get list of online agents
     */
    getOnlineAgents(): string[];
    /**
     * Get broker metrics
     */
    getMetrics(): {
        onlineAgents: number;
        pendingMessages: number;
        queueBackend: string;
        channels: string[];
        messagesSent: number;
        messagesDelivered: number;
        messagesFailed: number;
        activeChannels: number;
        activeSubscriptions: number;
    };
    /**
     * Get broker status
     */
    getStatus(): {
        status: string;
        metrics: {
            onlineAgents: number;
            pendingMessages: number;
            queueBackend: string;
            channels: string[];
            messagesSent: number;
            messagesDelivered: number;
            messagesFailed: number;
            activeChannels: number;
            activeSubscriptions: number;
        };
        channels: {
            name: string;
            participants: number;
            messageCount: number;
            lastActivity: Date;
        }[];
        onlineAgents: string[];
    };
    private startCleanupInterval;
    private cleanupStaleMessages;
    private initializeRedis;
    private getQueueKey;
    private getMessageKey;
    private getHeartbeatKey;
    private normalizePriority;
    private recordMessagePresence;
    private touchPresence;
    private mapPriority;
    private toScore;
    private deserializeMessage;
    private attachSequencingMetadata;
    private enqueueForAgent;
    private cleanupInactiveAgents;
}
//# sourceMappingURL=a2a-message-broker.service.d.ts.map