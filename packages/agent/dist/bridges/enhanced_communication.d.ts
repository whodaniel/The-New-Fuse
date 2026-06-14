/**
 * Enhanced Communication - Advanced communication patterns
 *
 * Provides advanced communication capabilities:
 * - Priority queues
 * - Message batching
 * - Retry logic
 * - Rate limiting
 * - Message transformation
 */
import { EventEmitter } from 'events';
import { Priority } from './index.js';
export interface QueuedMessage {
    id: string;
    message: unknown;
    priority: Priority;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    scheduledFor?: Date;
}
export interface BatchConfig {
    maxSize: number;
    maxWaitMs: number;
    processor: (messages: QueuedMessage[]) => Promise<void>;
}
export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}
export declare class PriorityQueue {
    private queues;
    /**
     * Add a message to the queue
     */
    enqueue(message: QueuedMessage): void;
    /**
     * Get the next message (highest priority first)
     */
    dequeue(): QueuedMessage | undefined;
    /**
     * Peek at next message without removing
     */
    peek(): QueuedMessage | undefined;
    /**
     * Get queue size
     */
    size(): number;
    /**
     * Check if empty
     */
    isEmpty(): boolean;
    /**
     * Clear all queues
     */
    clear(): void;
}
export declare class MessageBatcher extends EventEmitter {
    private batch;
    private config;
    private timer;
    constructor(config: BatchConfig);
    /**
     * Add message to batch
     */
    add(message: QueuedMessage): void;
    /**
     * Flush the batch
     */
    flush(): Promise<void>;
    /**
     * Get current batch size
     */
    size(): number;
}
export declare class RateLimiter {
    private requests;
    private config;
    constructor(config: RateLimitConfig);
    /**
     * Check if request is allowed
     */
    canProceed(): boolean;
    /**
     * Record a request
     */
    record(): void;
    /**
     * Wait until request is allowed
     */
    wait(): Promise<void>;
    /**
     * Get time to wait until next request is allowed
     */
    getWaitTime(): number;
    /**
     * Clean up old requests
     */
    private cleanup;
    /**
     * Get remaining requests in window
     */
    remaining(): number;
    /**
     * Reset the limiter
     */
    reset(): void;
}
export declare class RetryHandler {
    private defaultMaxAttempts;
    private defaultBaseDelayMs;
    private defaultMaxDelayMs;
    /**
     * Execute with retry
     */
    execute<T>(fn: () => Promise<T>, options?: {
        maxAttempts?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
        onRetry?: (attempt: number, error: Error) => void;
    }): Promise<T>;
}
export declare class EnhancedCommunication extends EventEmitter {
    private queue;
    private batcher;
    private rateLimiter;
    private retryHandler;
    private processing;
    private processInterval;
    constructor(options?: {
        batchConfig?: Partial<BatchConfig>;
        rateLimitConfig?: Partial<RateLimitConfig>;
    });
    /**
     * Send a message
     */
    send(message: unknown, priority?: Priority, options?: {
        maxAttempts?: number;
        batch?: boolean;
    }): Promise<void>;
    /**
     * Process a message
     */
    private processMessage;
    /**
     * Start processing queue
     */
    startProcessing(): void;
    /**
     * Stop processing
     */
    stopProcessing(): void;
    /**
     * Flush batched messages
     */
    flush(): Promise<void>;
    /**
     * Get statistics
     */
    getStatistics(): {
        queueSize: number;
        batchSize: number;
        rateLimitRemaining: number;
        processing: boolean;
    };
}
export default EnhancedCommunication;
//# sourceMappingURL=enhanced_communication.d.ts.map