/**
 * Message Queue Implementation
 *
 * Handles queuing of messages for offline services and retry handling
 * with persistence and delivery guarantees.
 */
import { EventEmitter } from 'events';
import { MCPRequest, MCPNotification } from '../interfaces/IMCPMessage';
/**
 * Queued message types
 */
export declare enum QueuedMessageType {
    REQUEST = "request",
    NOTIFICATION = "notification"
}
/**
 * Queued message interface
 */
export interface QueuedMessage {
    id: string;
    type: QueuedMessageType;
    targetService: string;
    message: MCPRequest | MCPNotification;
    priority: number;
    maxRetries: number;
    currentRetries: number;
    createdAt: Date;
    lastAttempt?: Date;
    nextAttempt: Date;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}
/**
 * Queue configuration
 */
export interface QueueConfig {
    maxSize: number;
    defaultPriority: number;
    defaultMaxRetries: number;
    retryDelayMs: number;
    maxRetryDelayMs: number;
    backoffMultiplier: number;
    messageTimeoutMs: number;
    cleanupIntervalMs: number;
}
/**
 * Queue statistics
 */
export interface QueueStats {
    totalMessages: number;
    pendingMessages: number;
    processingMessages: number;
    failedMessages: number;
    expiredMessages: number;
    messagesByService: Record<string, number>;
    messagesByType: Record<QueuedMessageType, number>;
    averageWaitTime: number;
    oldestMessage?: Date;
}
/**
 * Message Queue class for handling offline service messages
 */
export declare class MessageQueue extends EventEmitter {
    private queue;
    private processingQueue;
    private serviceQueues;
    private config;
    private cleanupTimer?;
    private isStarted;
    constructor(config?: Partial<QueueConfig>);
    /**
     * Start the message queue
     */
    start(): Promise<void>;
    /**
     * Stop the message queue
     */
    stop(): Promise<void>;
    /**
     * Enqueue a message for a service
     */
    enqueueMessage(targetService: string, message: MCPRequest | MCPNotification, options?: {
        priority?: number;
        maxRetries?: number;
        timeoutMs?: number;
        metadata?: Record<string, any>;
    }): Promise<string>;
    /**
     * Dequeue messages for a service (when service comes online)
     */
    dequeueMessagesForService(serviceId: string): Promise<QueuedMessage[]>;
    /**
     * Mark message as processing
     */
    markMessageProcessing(messageId: string): Promise<void>;
    /**
     * Mark message as successfully processed
     */
    markMessageCompleted(messageId: string): Promise<void>;
    /**
     * Mark message as failed and schedule retry if applicable
     */
    markMessageFailed(messageId: string, error: Error): Promise<void>;
    /**
     * Get messages for a specific service
     */
    getMessagesForService(serviceId: string): QueuedMessage[];
    /**
     * Get message by ID
     */
    getMessage(messageId: string): QueuedMessage | null;
    /**
     * Remove message from queue
     */
    removeMessage(messageId: string): Promise<boolean>;
    /**
     * Clear all messages for a service
     */
    clearServiceMessages(serviceId: string): Promise<number>;
    /**
     * Get queue statistics
     */
    getStatistics(): QueueStats;
    /**
     * Clean up expired messages
     */
    private cleanupExpiredMessages;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
}
//# sourceMappingURL=MessageQueue.d.ts.map