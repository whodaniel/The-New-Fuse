"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedCommunication = exports.RetryHandler = exports.RateLimiter = exports.MessageBatcher = exports.PriorityQueue = void 0;
const events_1 = require("events");
const index_js_1 = require("./index.js");
// ============================================================
// PRIORITY QUEUE
// ============================================================
class PriorityQueue {
    constructor() {
        this.queues = new Map([
            [index_js_1.Priority.CRITICAL, []],
            [index_js_1.Priority.HIGH, []],
            [index_js_1.Priority.MEDIUM, []],
            [index_js_1.Priority.LOW, []],
        ]);
    }
    /**
     * Add a message to the queue
     */
    enqueue(message) {
        const queue = this.queues.get(message.priority) || [];
        queue.push(message);
        this.queues.set(message.priority, queue);
    }
    /**
     * Get the next message (highest priority first)
     */
    dequeue() {
        for (const priority of [index_js_1.Priority.CRITICAL, index_js_1.Priority.HIGH, index_js_1.Priority.MEDIUM, index_js_1.Priority.LOW]) {
            const queue = this.queues.get(priority);
            if (queue && queue.length > 0) {
                return queue.shift();
            }
        }
        return undefined;
    }
    /**
     * Peek at next message without removing
     */
    peek() {
        for (const priority of [index_js_1.Priority.CRITICAL, index_js_1.Priority.HIGH, index_js_1.Priority.MEDIUM, index_js_1.Priority.LOW]) {
            const queue = this.queues.get(priority);
            if (queue && queue.length > 0) {
                return queue[0];
            }
        }
        return undefined;
    }
    /**
     * Get queue size
     */
    size() {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += queue.length;
        }
        return total;
    }
    /**
     * Check if empty
     */
    isEmpty() {
        return this.size() === 0;
    }
    /**
     * Clear all queues
     */
    clear() {
        for (const queue of this.queues.values()) {
            queue.length = 0;
        }
    }
}
exports.PriorityQueue = PriorityQueue;
// ============================================================
// MESSAGE BATCHER
// ============================================================
class MessageBatcher extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.batch = [];
        this.timer = null;
        this.config = config;
    }
    /**
     * Add message to batch
     */
    add(message) {
        this.batch.push(message);
        // Start timer if first message
        if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.config.maxWaitMs);
        }
        // Flush if batch is full
        if (this.batch.length >= this.config.maxSize) {
            this.flush();
        }
    }
    /**
     * Flush the batch
     */
    async flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.batch.length === 0)
            return;
        const messages = [...this.batch];
        this.batch = [];
        try {
            await this.config.processor(messages);
            this.emit('batch:processed', { count: messages.length });
        }
        catch (error) {
            this.emit('batch:error', { error, count: messages.length });
        }
    }
    /**
     * Get current batch size
     */
    size() {
        return this.batch.length;
    }
}
exports.MessageBatcher = MessageBatcher;
// ============================================================
// RATE LIMITER
// ============================================================
class RateLimiter {
    constructor(config) {
        this.requests = [];
        this.config = config;
    }
    /**
     * Check if request is allowed
     */
    canProceed() {
        this.cleanup();
        return this.requests.length < this.config.maxRequests;
    }
    /**
     * Record a request
     */
    record() {
        this.requests.push(new Date());
    }
    /**
     * Wait until request is allowed
     */
    async wait() {
        while (!this.canProceed()) {
            const waitTime = this.getWaitTime();
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        this.record();
    }
    /**
     * Get time to wait until next request is allowed
     */
    getWaitTime() {
        this.cleanup();
        if (this.requests.length < this.config.maxRequests) {
            return 0;
        }
        const oldestRequest = this.requests[0];
        const windowEnd = oldestRequest.getTime() + this.config.windowMs;
        return Math.max(0, windowEnd - Date.now());
    }
    /**
     * Clean up old requests
     */
    cleanup() {
        const cutoff = Date.now() - this.config.windowMs;
        this.requests = this.requests.filter((r) => r.getTime() > cutoff);
    }
    /**
     * Get remaining requests in window
     */
    remaining() {
        this.cleanup();
        return Math.max(0, this.config.maxRequests - this.requests.length);
    }
    /**
     * Reset the limiter
     */
    reset() {
        this.requests = [];
    }
}
exports.RateLimiter = RateLimiter;
// ============================================================
// RETRY HANDLER
// ============================================================
class RetryHandler {
    constructor() {
        this.defaultMaxAttempts = 3;
        this.defaultBaseDelayMs = 1000;
        this.defaultMaxDelayMs = 30000;
    }
    /**
     * Execute with retry
     */
    async execute(fn, options = {}) {
        const maxAttempts = options.maxAttempts || this.defaultMaxAttempts;
        const baseDelayMs = options.baseDelayMs || this.defaultBaseDelayMs;
        const maxDelayMs = options.maxDelayMs || this.defaultMaxDelayMs;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt === maxAttempts) {
                    throw lastError;
                }
                if (options.onRetry) {
                    options.onRetry(attempt, lastError);
                }
                // Exponential backoff with jitter
                const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1) * (0.5 + Math.random()));
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw lastError || new Error('Max retries exceeded');
    }
}
exports.RetryHandler = RetryHandler;
// ============================================================
// ENHANCED COMMUNICATION
// ============================================================
class EnhancedCommunication extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.queue = new PriorityQueue();
        this.retryHandler = new RetryHandler();
        this.processing = false;
        this.processInterval = null;
        this.batcher = new MessageBatcher({
            maxSize: options.batchConfig?.maxSize || 100,
            maxWaitMs: options.batchConfig?.maxWaitMs || 1000,
            processor: async (messages) => {
                for (const message of messages) {
                    await this.processMessage(message);
                }
            },
        });
        this.rateLimiter = new RateLimiter({
            maxRequests: options.rateLimitConfig?.maxRequests || 100,
            windowMs: options.rateLimitConfig?.windowMs || 1000,
        });
        this.startProcessing();
    }
    /**
     * Send a message
     */
    async send(message, priority = index_js_1.Priority.MEDIUM, options = {}) {
        const queuedMessage = {
            id: `msg-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            message,
            priority,
            attempts: 0,
            maxAttempts: options.maxAttempts || 3,
            createdAt: new Date(),
        };
        if (options.batch) {
            this.batcher.add(queuedMessage);
        }
        else {
            this.queue.enqueue(queuedMessage);
        }
        this.emit('message:queued', queuedMessage);
    }
    /**
     * Process a message
     */
    async processMessage(message) {
        await this.rateLimiter.wait();
        try {
            await this.retryHandler.execute(async () => {
                message.attempts++;
                // Actual message sending would happen here
                this.emit('message:sent', message);
            }, {
                maxAttempts: message.maxAttempts,
                onRetry: (attempt, error) => {
                    this.emit('message:retry', { message, attempt, error });
                },
            });
        }
        catch (error) {
            this.emit('message:failed', { message, error });
        }
    }
    /**
     * Start processing queue
     */
    startProcessing() {
        if (this.processInterval)
            return;
        this.processInterval = setInterval(async () => {
            if (this.processing)
                return;
            this.processing = true;
            while (!this.queue.isEmpty()) {
                const message = this.queue.dequeue();
                if (message) {
                    await this.processMessage(message);
                }
            }
            this.processing = false;
        }, 100);
    }
    /**
     * Stop processing
     */
    stopProcessing() {
        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = null;
        }
    }
    /**
     * Flush batched messages
     */
    async flush() {
        await this.batcher.flush();
    }
    /**
     * Get statistics
     */
    getStatistics() {
        return {
            queueSize: this.queue.size(),
            batchSize: this.batcher.size(),
            rateLimitRemaining: this.rateLimiter.remaining(),
            processing: this.processing,
        };
    }
}
exports.EnhancedCommunication = EnhancedCommunication;
exports.default = EnhancedCommunication;
//# sourceMappingURL=enhanced_communication.js.map