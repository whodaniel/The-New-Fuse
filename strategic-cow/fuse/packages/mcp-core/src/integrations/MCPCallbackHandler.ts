/**
 * MCP Callback Handler
 * 
 * Manages asynchronous callbacks from MCP services, providing reliable delivery,
 * retry mechanisms, and callback routing for workflow executions.
 */

import { EventEmitter } from 'events';
import { MCPCallback, TaskExecutionStatus } from '../interfaces/IMCPWorkflowIntegration';
import { MCPErrorClass } from '../types/error';

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
export class MCPCallbackHandler extends EventEmitter {
  private readonly config: CallbackHandlerConfig;
  private readonly registrations = new Map<string, CallbackRegistration>();
  private readonly callbackQueue: CallbackQueueEntry[] = [];
  private readonly processingResults = new Map<string, CallbackProcessingResult>();
  private readonly statistics: CallbackStatistics;
  private processingInterval?: NodeJS.Timeout;
  private isProcessing = false;
  private isStarted = false;

  constructor(config: CallbackHandlerConfig) {
    super();
    this.config = config;
    
    this.statistics = {
      totalReceived: 0,
      successfullyProcessed: 0,
      failed: 0,
      queued: 0,
      averageProcessingTime: 0,
      successRate: 0,
      callbacksPerMinute: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Start the callback handler
   */
  start(): void {
    if (this.isStarted) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processCallbackQueue();
    }, this.config.processingInterval);

    this.isStarted = true;
    this.emit('started');
  }

  /**
   * Stop the callback handler
   */
  stop(): void {
    if (!this.isStarted) {
      return;
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    this.isStarted = false;
    this.emit('stopped');
  }

  /**
   * Register a callback handler for an execution
   */
  registerHandler(executionId: string, handler: (callback: MCPCallback) => Promise<void>, options?: {
    timeout?: number;
    metadata?: Record<string, any>;
  }): void {
    const registration: CallbackRegistration = {
      executionId,
      handler,
      registeredAt: new Date(),
      timeout: options?.timeout,
      metadata: options?.metadata
    };

    this.registrations.set(executionId, registration);
    this.emit('handlerRegistered', { executionId, registration });
  }

  /**
   * Unregister a callback handler
   */
  unregisterHandler(executionId: string): boolean {
    const existed = this.registrations.has(executionId);
    this.registrations.delete(executionId);
    
    if (existed) {
      this.emit('handlerUnregistered', { executionId });
    }
    
    return existed;
  }

  /**
   * Handle an incoming MCP callback
   */
  async handleCallback(callback: MCPCallback): Promise<void> {
    this.statistics.totalReceived++;
    
    try {
      // Validate callback
      this.validateCallback(callback);
      
      // Check if we have a registered handler
      const registration = this.registrations.get(callback.executionId);
      if (!registration) {
        // Queue for later processing or handle as orphaned callback
        this.handleOrphanedCallback(callback);
        return;
      }

      // Try immediate processing first
      try {
        await this.processCallbackImmediate(callback, registration);
        this.statistics.successfullyProcessed++;
        this.emit('callbackProcessed', { callback, immediate: true });
      } catch (error) {
        // Queue for retry processing
        this.queueCallback(callback);
        this.emit('callbackQueued', { callback, error });
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.statistics.failed++;
      this.emit('callbackError', { callback, error: err });
      throw err;
    } finally {
      this.updateStatistics();
    }
  }

  /**
   * Get callback processing statistics
   */
  getStatistics(): CallbackStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    size: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    pendingRetries: number;
  } {
    const now = new Date();
    const pendingRetries = this.callbackQueue.filter(entry => entry.nextRetry <= now).length;
    
    return {
      size: this.callbackQueue.length,
      oldestEntry: this.callbackQueue.length > 0 ? this.callbackQueue[0].createdAt : undefined,
      newestEntry: this.callbackQueue.length > 0 ? this.callbackQueue[this.callbackQueue.length - 1].createdAt : undefined,
      pendingRetries
    };
  }

  /**
   * Get registered handlers
   */
  getRegisteredHandlers(): Map<string, CallbackRegistration> {
    return new Map(this.registrations);
  }

  /**
   * Clear the callback queue
   */
  clearQueue(): number {
    const clearedCount = this.callbackQueue.length;
    this.callbackQueue.splice(0);
    this.emit('queueCleared', { clearedCount });
    return clearedCount;
  }

  /**
   * Retry failed callbacks for a specific execution
   */
  async retryCallbacks(executionId: string): Promise<number> {
    const retriedCount = 0;
    const now = new Date();
    
    for (const entry of this.callbackQueue) {
      if (entry.callback.executionId === executionId) {
        entry.nextRetry = now;
        entry.attempts = 0; // Reset attempts
      }
    }
    
    // Trigger immediate processing
    if (!this.isProcessing) {
      setImmediate(() => this.processCallbackQueue());
    }
    
    return retriedCount;
  }

  /**
   * Remove callbacks for a specific execution
   */
  removeCallbacks(executionId: string): number {
    const initialLength = this.callbackQueue.length;
    
    for (let i = this.callbackQueue.length - 1; i >= 0; i--) {
      if (this.callbackQueue[i].callback.executionId === executionId) {
        this.callbackQueue.splice(i, 1);
      }
    }
    
    const removedCount = initialLength - this.callbackQueue.length;
    
    if (removedCount > 0) {
      this.emit('callbacksRemoved', { executionId, removedCount });
    }
    
    return removedCount;
  }

  // Private helper methods

  private validateCallback(callback: MCPCallback): void {
    if (!callback.executionId) {
      throw new MCPErrorClass(-32602, 'Callback must have an execution ID');
    }
    
    if (!callback.type) {
      throw new MCPErrorClass(-32602, 'Callback must have a type');
    }
    
    if (!['progress', 'result', 'error', 'status'].includes(callback.type)) {
      throw new MCPErrorClass(-32602, `Invalid callback type: ${callback.type}`);
    }
    
    if (!callback.timestamp) {
      throw new MCPErrorClass(-32602, 'Callback must have a timestamp');
    }
    
    if (!callback.source) {
      throw new MCPErrorClass(-32602, 'Callback must have a source');
    }
  }

  private async processCallbackImmediate(callback: MCPCallback, registration: CallbackRegistration): Promise<void> {
    const startTime = Date.now();
    const timeout = registration.timeout || this.config.callbackTimeout;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Callback processing timeout')), timeout);
      });
      
      // Race between handler execution and timeout
      await Promise.race([
        registration.handler(callback),
        timeoutPromise
      ]);
      
      const duration = Date.now() - startTime;
      
      const result: CallbackProcessingResult = {
        success: true,
        duration,
        attempts: 1
      };
      
      this.processingResults.set(this.generateResultId(callback), result);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      
      const result: CallbackProcessingResult = {
        success: false,
        duration,
        error: err.message,
        attempts: 1
      };
      
      this.processingResults.set(this.generateResultId(callback), result);
      throw err;
    }
  }

  private queueCallback(callback: MCPCallback): void {
    if (this.callbackQueue.length >= this.config.maxQueueSize) {
      // Remove oldest entry to make room
      const removed = this.callbackQueue.shift();
      if (removed) {
        this.emit('callbackDropped', { callback: removed.callback, reason: 'queue_full' });
      }
    }

    const entry: CallbackQueueEntry = {
      id: this.generateQueueEntryId(),
      callback,
      attempts: 0,
      nextRetry: new Date(),
      createdAt: new Date()
    };

    this.callbackQueue.push(entry);
    this.statistics.queued = this.callbackQueue.length;
  }

  private async processCallbackQueue(): Promise<void> {
    if (this.isProcessing || this.callbackQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const now = new Date();
    const batchSize = Math.min(this.config.batchSize, this.callbackQueue.length);
    const batch: CallbackQueueEntry[] = [];

    try {
      // Select entries ready for processing
      for (let i = 0; i < this.callbackQueue.length && batch.length < batchSize; i++) {
        const entry = this.callbackQueue[i];
        if (entry.nextRetry <= now) {
          batch.push(entry);
        }
      }

      // Process batch
      for (const entry of batch) {
        await this.processQueuedCallback(entry);
      }

    } catch (error) {
      console.error('[MCPCallbackHandler] Error processing callback queue:', error);
    } finally {
      this.isProcessing = false;
      this.statistics.queued = this.callbackQueue.length;
    }
  }

  private async processQueuedCallback(entry: CallbackQueueEntry): Promise<void> {
    const registration = this.registrations.get(entry.callback.executionId);
    
    if (!registration) {
      // Handler was unregistered, remove from queue
      this.removeQueueEntry(entry.id);
      this.emit('callbackOrphaned', { callback: entry.callback });
      return;
    }

    entry.attempts++;
    entry.lastAttempt = new Date();

    try {
      await this.processCallbackImmediate(entry.callback, registration);
      
      // Success - remove from queue
      this.removeQueueEntry(entry.id);
      this.statistics.successfullyProcessed++;
      this.emit('callbackProcessed', { callback: entry.callback, attempts: entry.attempts });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      entry.lastError = err.message;

      if (entry.attempts >= this.config.maxRetries) {
        // Max retries exceeded - remove from queue and mark as failed
        this.removeQueueEntry(entry.id);
        this.statistics.failed++;
        this.emit('callbackFailed', { callback: entry.callback, error: err, attempts: entry.attempts });
      } else {
        // Schedule retry
        entry.nextRetry = this.calculateNextRetry(entry.attempts);
        this.emit('callbackRetryScheduled', { callback: entry.callback, nextRetry: entry.nextRetry, attempts: entry.attempts });
      }
    }
  }

  private removeQueueEntry(entryId: string): boolean {
    const index = this.callbackQueue.findIndex(entry => entry.id === entryId);
    if (index >= 0) {
      this.callbackQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  private calculateNextRetry(attempts: number): Date {
    let delay: number;

    switch (this.config.retryStrategy) {
      case 'exponential':
        delay = Math.min(
          this.config.retryDelay * Math.pow(2, attempts - 1),
          this.config.maxRetryDelay
        );
        break;
      case 'linear':
        delay = Math.min(
          this.config.retryDelay * attempts,
          this.config.maxRetryDelay
        );
        break;
      case 'fixed':
      default:
        delay = this.config.retryDelay;
        break;
    }

    return new Date(Date.now() + delay);
  }

  private handleOrphanedCallback(callback: MCPCallback): void {
    // For orphaned callbacks, we can either:
    // 1. Queue them for a short time in case handler is registered later
    // 2. Log and discard them
    // 3. Store them for manual inspection
    
    // For now, we'll emit an event and optionally queue for a short time
    this.emit('orphanedCallback', { callback });
    
    // Optionally queue for a short time (e.g., 30 seconds)
    setTimeout(() => {
      const registration = this.registrations.get(callback.executionId);
      if (registration) {
        // Handler was registered later, process the callback
        this.handleCallback(callback).catch(error => {
          this.emit('orphanedCallbackError', { callback, error });
        });
      }
    }, 30000);
  }

  private updateStatistics(): void {
    const total = this.statistics.successfullyProcessed + this.statistics.failed;
    
    if (total > 0) {
      this.statistics.successRate = (this.statistics.successfullyProcessed / total) * 100;
    }

    // Calculate average processing time from recent results
    const recentResults = Array.from(this.processingResults.values()).slice(-100);
    if (recentResults.length > 0) {
      const totalTime = recentResults.reduce((sum, result) => sum + result.duration, 0);
      this.statistics.averageProcessingTime = totalTime / recentResults.length;
    }

    // Calculate callbacks per minute (simplified)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    // This is a simplified calculation - in a real implementation, you'd track timestamps
    this.statistics.callbacksPerMinute = this.statistics.successfullyProcessed; // Placeholder

    this.statistics.queued = this.callbackQueue.length;
    this.statistics.lastUpdated = new Date();
  }

  private generateQueueEntryId(): string {
    return `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResultId(callback: MCPCallback): string {
    return `result-${callback.executionId}-${callback.timestamp.getTime()}`;
  }
}