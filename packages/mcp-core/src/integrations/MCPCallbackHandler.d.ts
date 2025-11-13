/**
 * MCP Callback Handler
 *
 * Manages asynchronous callbacks from MCP services, providing reliable delivery,
 * retry mechanisms, and callback routing for workflow executions.
 */
import { EventEmitter } from 'events';
import { MCPCallback } from '../interfaces/IMCPWorkflowIntegration';
/**
 * Callback handler configuration
 */
export interface CallbackHandlerConfig {
    /** Maximum number of retry attempts for failed callbacks */
    maxRetries: number;
    /** Base delay between retries in milliseconds */
    retryDelay: number;
    /** Maximum delay between retries in milliseconds */
    maxRetryDelay: number;
    /** Retry strategy */
    retryStrategy: 'fixed' | 'exponential' | 'linear';
    /** Callback timeout in milliseconds */
    callbackTimeout: number;
    /** Maximum number of callbacks to queue */
    maxQueueSize: number;
    /** Enable callback persistence */
    enablePersistence: boolean;
    /** Callback processing batch size */
    batchSize: number;
    /** Processing interval in milliseconds */
    processingInterval: number;
}
/**
 * Callback registration
 */
export interface CallbackRegistration {
    /** Execution ID */
    executionId: string;
    /** Callback handler function */
    handler: (callback: MCPCallback) => Promise<void>;
    /** Registration timestamp */
    registeredAt: Date;
    /** Handler timeout */
    timeout?: number;
    /** Handler metadata */
    metadata?: Record<string, any>;
}
/**
 * Callback queue entry
 */
export interface CallbackQueueEntry {
    /** Unique entry ID */
    id: string;
    /** The callback to process */
    callback: MCPCallback;
    /** Number of processing attempts */
    attempts: number;
    /** Next retry time */
    nextRetry: Date;
    /** Entry creation time */
    createdAt: Date;
    /** Last processing attempt time */
    lastAttempt?: Date;
    /** Last error encountered */
    lastError?: string;
    /** Entry metadata */
    metadata?: Record<string, any>;
}
/**
 * Callback processing result
 */
export interface CallbackProcessingResult {
    /** Whether processing was successful */
    success: boolean;
    /** Processing duration in milliseconds */
    duration: number;
    /** Error message if failed */
    error?: string;
    /** Number of attempts made */
    attempts: number;
    /** Processing metadata */
    metadata?: Record<string, any>;
}
/**
 * Callback statistics
 */
export interface CallbackStatistics {
    /** Total callbacks received */
    totalReceived: number;
    /** Successfully processed callbacks */
    successfullyProcessed: number;
    /** Failed callbacks */
    failed: number;
    /** Currently queued callbacks */
    queued: number;
    /** Average processing time in milliseconds */
    averageProcessingTime: number;
    /** Success rate as percentage */
    successRate: number;
    /** Callbacks processed per minute */
    callbacksPerMinute: number;
    /** Last update timestamp */
    lastUpdated: Date;
}
/**
 * MCP Callback Handler implementation
 */
export declare class MCPCallbackHandler extends EventEmitter {
    private readonly config;
    private readonly registrations;
    private readonly callbackQueue;
    private readonly processingResults;
    private readonly statistics;
    private processingInterval?;
    private isProcessing;
    private isStarted;
    constructor(config: CallbackHandlerConfig);
    /**
     * Start the callback handler
     */
    start(): void;
    /**
     * Stop the callback handler
     */
    stop(): void;
    /**
     * Register a callback handler for an execution
     */
    registerHandler(executionId: string, handler: (callback: MCPCallback) => Promise<void>, options?: {
        timeout?: number;
        metadata?: Record<string, any>;
    }): void;
    /**
     * Unregister a callback handler
     */
    unregisterHandler(executionId: string): boolean;
    /**
     * Handle an incoming MCP callback
     */
    handleCallback(callback: MCPCallback): Promise<void>;
    /**
     * Get callback processing statistics
     */
    getStatistics(): CallbackStatistics;
    /**
     * Get current queue status
     */
    getQueueStatus(): {
        size: number;
        oldestEntry?: Date;
        newestEntry?: Date;
        pendingRetries: number;
    };
    /**
     * Get registered handlers
     */
    getRegisteredHandlers(): Map<string, CallbackRegistration>;
    /**
     * Clear the callback queue
     */
    clearQueue(): number;
    /**
     * Retry failed callbacks for a specific execution
     */
    retryCallbacks(executionId: string): Promise<number>;
    /**
     * Remove callbacks for a specific execution
     */
    removeCallbacks(executionId: string): number;
    private validateCallback;
    private processCallbackImmediate;
    private queueCallback;
    private processCallbackQueue;
    private processQueuedCallback;
    private removeQueueEntry;
    private calculateNextRetry;
    private handleOrphanedCallback;
    private updateStatistics;
    private generateQueueEntryId;
    private generateResultId;
}
//# sourceMappingURL=MCPCallbackHandler.d.ts.map