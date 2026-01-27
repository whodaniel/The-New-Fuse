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

import { Priority } from './index';

// ============================================================
// ENHANCED TYPES
// ============================================================

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

// ============================================================
// PRIORITY QUEUE
// ============================================================

export class PriorityQueue {
  private queues: Map<Priority, QueuedMessage[]> = new Map([
    [Priority.CRITICAL, []],
    [Priority.HIGH, []],
    [Priority.MEDIUM, []],
    [Priority.LOW, []],
  ]);

  /**
   * Add a message to the queue
   */
  enqueue(message: QueuedMessage): void {
    const queue = this.queues.get(message.priority) || [];
    queue.push(message);
    this.queues.set(message.priority, queue);
  }

  /**
   * Get the next message (highest priority first)
   */
  dequeue(): QueuedMessage | undefined {
    for (const priority of [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW]) {
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
  peek(): QueuedMessage | undefined {
    for (const priority of [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW]) {
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
  size(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
  }
}

// ============================================================
// MESSAGE BATCHER
// ============================================================

export class MessageBatcher extends EventEmitter {
  private batch: QueuedMessage[] = [];
  private config: BatchConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: BatchConfig) {
    super();
    this.config = config;
  }

  /**
   * Add message to batch
   */
  add(message: QueuedMessage): void {
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
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) {
      return;
    }

    const messages = [...this.batch];
    this.batch = [];

    try {
      await this.config.processor(messages);
      this.emit('batch:processed', { count: messages.length });
    } catch (error) {
      this.emit('batch:error', { error, count: messages.length });
    }
  }

  /**
   * Get current batch size
   */
  size(): number {
    return this.batch.length;
  }
}

// ============================================================
// RATE LIMITER
// ============================================================

export class RateLimiter {
  private requests: Date[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  canProceed(): boolean {
    this.cleanup();
    return this.requests.length < this.config.maxRequests;
  }

  /**
   * Record a request
   */
  record(): void {
    this.requests.push(new Date());
  }

  /**
   * Wait until request is allowed
   */
  async wait(): Promise<void> {
    while (!this.canProceed()) {
      const waitTime = this.getWaitTime();
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.record();
  }

  /**
   * Get time to wait until next request is allowed
   */
  getWaitTime(): number {
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
  private cleanup(): void {
    const cutoff = Date.now() - this.config.windowMs;
    this.requests = this.requests.filter((r) => r.getTime() > cutoff);
  }

  /**
   * Get remaining requests in window
   */
  remaining(): number {
    this.cleanup();
    return Math.max(0, this.config.maxRequests - this.requests.length);
  }

  /**
   * Reset the limiter
   */
  reset(): void {
    this.requests = [];
  }
}

// ============================================================
// RETRY HANDLER
// ============================================================

export class RetryHandler {
  private defaultMaxAttempts = 3;
  private defaultBaseDelayMs = 1000;
  private defaultMaxDelayMs = 30000;

  /**
   * Execute with retry
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelayMs?: number;
      maxDelayMs?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || this.defaultMaxAttempts;
    const baseDelayMs = options.baseDelayMs || this.defaultBaseDelayMs;
    const maxDelayMs = options.maxDelayMs || this.defaultMaxDelayMs;

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts) {
          throw lastError;
        }

        if (options.onRetry) {
          options.onRetry(attempt, lastError);
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          maxDelayMs,
          baseDelayMs * Math.pow(2, attempt - 1) * (0.5 + Math.random())
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}

// ============================================================
// ENHANCED COMMUNICATION
// ============================================================

export class EnhancedCommunication extends EventEmitter {
  private queue: PriorityQueue = new PriorityQueue();
  private batcher: MessageBatcher;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler = new RetryHandler();
  private processing = false;
  private processInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    options: {
      batchConfig?: Partial<BatchConfig>;
      rateLimitConfig?: Partial<RateLimitConfig>;
    } = {}
  ) {
    super();

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
  async send(
    message: unknown,
    priority: Priority = Priority.MEDIUM,
    options: {
      maxAttempts?: number;
      batch?: boolean;
    } = {}
  ): Promise<void> {
    const queuedMessage: QueuedMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      priority,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
    };

    if (options.batch) {
      this.batcher.add(queuedMessage);
    } else {
      this.queue.enqueue(queuedMessage);
    }

    this.emit('message:queued', queuedMessage);
  }

  /**
   * Process a message
   */
  private async processMessage(message: QueuedMessage): Promise<void> {
    await this.rateLimiter.wait();

    try {
      await this.retryHandler.execute(
        async () => {
          message.attempts++;
          // Actual message sending would happen here
          this.emit('message:sent', message);
        },
        {
          maxAttempts: message.maxAttempts,
          onRetry: (attempt, error) => {
            this.emit('message:retry', { message, attempt, error });
          },
        }
      );
    } catch (error) {
      this.emit('message:failed', { message, error });
    }
  }

  /**
   * Start processing queue
   */
  startProcessing(): void {
    if (this.processInterval) {
      return;
    }

    this.processInterval = setInterval(async () => {
      if (this.processing) {
        return;
      }
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
  stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Flush batched messages
   */
  async flush(): Promise<void> {
    await this.batcher.flush();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    queueSize: number;
    batchSize: number;
    rateLimitRemaining: number;
    processing: boolean;
  } {
    return {
      queueSize: this.queue.size(),
      batchSize: this.batcher.size(),
      rateLimitRemaining: this.rateLimiter.remaining(),
      processing: this.processing,
    };
  }
}

export default EnhancedCommunication;
