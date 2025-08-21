import { Logger } from '../../../core-monitoring/src/utils/Logger';
import { FileChangeEvent } from '../watchers/EnhancedFileSystemWatcher';

export interface BatchConfig {
  maxBatchSize: number;
  batchTimeout: number;
  debounceDelay: number;
  priorityPatterns: string[];
}

export interface BatchedFileChange {
  id: string;
  events: FileChangeEvent[];
  batchedAt: Date;
  priority: 'high' | 'normal' | 'low';
  tenantId?: string;
}

/**
 * Batches and debounces file changes to prevent overwhelming downstream services
 * Implements intelligent batching based on file patterns and change frequency
 */
export class FileChangeBatcher {
  private readonly logger = new Logger('FileChangeBatcher');
  private readonly pendingChanges = new Map<string, FileChangeEvent>();
  private readonly debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly batchTimers = new Map<string, NodeJS.Timeout>();
  private readonly batches = new Map<string, FileChangeEvent[]>();
  private batchCounter = 0;

  constructor(
    private readonly config: BatchConfig,
    private readonly onBatchReady: (batch: BatchedFileChange) => Promise<void>
  ) {}

  /**
   * Add a file change event to the batcher
   */
  async addFileChange(event: FileChangeEvent): Promise<void> {
    const key = this.getChangeKey(event);
    const priority = this.determinePriority(event);

    // Cancel existing debounce timer for this file
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Store the latest change for this file
    this.pendingChanges.set(key, event);

    // Set debounce timer
    const debounceTimer = setTimeout(async () => {
      await this.processDebounced(key, priority);
    }, this.config.debounceDelay);

    this.debounceTimers.set(key, debounceTimer);

    this.logger.debug('File change added to batcher', {
      filePath: event.filePath,
      type: event.type,
      priority,
      pendingCount: this.pendingChanges.size
    });
  }

  /**
   * Process debounced file change
   */
  private async processDebounced(key: string, priority: 'high' | 'normal' | 'low'): Promise<void> {
    const event = this.pendingChanges.get(key);
    if (!event) return;

    // Remove from pending
    this.pendingChanges.delete(key);
    this.debounceTimers.delete(key);

    // Add to appropriate batch
    const batchKey = this.getBatchKey(event, priority);
    await this.addToBatch(batchKey, event, priority);
  }

  /**
   * Add event to batch and manage batch lifecycle
   */
  private async addToBatch(batchKey: string, event: FileChangeEvent, priority: 'high' | 'normal' | 'low'): Promise<void> {
    // Initialize batch if it doesn't exist
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, []);
    }

    const batch = this.batches.get(batchKey)!;
    batch.push(event);

    // Check if batch should be processed immediately
    const shouldProcessNow = 
      priority === 'high' || 
      batch.length >= this.config.maxBatchSize;

    if (shouldProcessNow) {
      await this.processBatch(batchKey, priority);
    } else {
      // Set or reset batch timer
      const existingTimer = this.batchTimers.get(batchKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const batchTimer = setTimeout(async () => {
        await this.processBatch(batchKey, priority);
      }, this.config.batchTimeout);

      this.batchTimers.set(batchKey, batchTimer);
    }
  }

  /**
   * Process and emit a batch
   */
  private async processBatch(batchKey: string, priority: 'high' | 'normal' | 'low'): Promise<void> {
    const events = this.batches.get(batchKey);
    if (!events || events.length === 0) return;

    // Clear batch and timer
    this.batches.delete(batchKey);
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Create batched change
    const batchedChange: BatchedFileChange = {
      id: `batch-${++this.batchCounter}-${Date.now()}`,
      events: [...events], // Clone array
      batchedAt: new Date(),
      priority,
      tenantId: events[0]?.tenantId
    };

    try {
      await this.onBatchReady(batchedChange);
      
      this.logger.info('Batch processed successfully', {
        batchId: batchedChange.id,
        eventCount: events.length,
        priority,
        tenantId: batchedChange.tenantId
      });
    } catch (error) {
      this.logger.error('Failed to process batch', {
        batchId: batchedChange.id,
        eventCount: events.length,
        error
      });
      
      // Re-queue individual events for retry
      for (const event of events) {
        setTimeout(() => {
          this.addFileChange(event);
        }, 1000); // Retry after 1 second
      }
    }
  }

  /**
   * Generate unique key for file changes (for debouncing)
   */
  private getChangeKey(event: FileChangeEvent): string {
    return `${event.tenantId || 'global'}:${event.filePath}`;
  }

  /**
   * Generate batch key for grouping related changes
   */
  private getBatchKey(event: FileChangeEvent, priority: 'high' | 'normal' | 'low'): string {
    const tenantPart = event.tenantId || 'global';
    const typePart = this.getFileType(event.filePath);
    return `${tenantPart}:${typePart}:${priority}`;
  }

  /**
   * Determine priority based on file patterns
   */
  private determinePriority(event: FileChangeEvent): 'high' | 'normal' | 'low' {
    // High priority for patterns in config
    for (const pattern of this.config.priorityPatterns) {
      if (event.filePath.includes(pattern)) {
        return 'high';
      }
    }

    // High priority for certain file types
    if (event.filePath.endsWith('.env') || 
        event.filePath.includes('config') ||
        event.filePath.includes('template')) {
      return 'high';
    }

    // Low priority for temporary/cache files
    if (event.filePath.includes('.tmp') ||
        event.filePath.includes('.cache') ||
        event.filePath.includes('node_modules')) {
      return 'low';
    }

    return 'normal';
  }

  /**
   * Get file type for batching
   */
  private getFileType(filePath: string): string {
    if (filePath.includes('template')) return 'template';
    if (filePath.includes('config')) return 'config';
    if (filePath.includes('agent')) return 'agent';
    if (filePath.endsWith('.ts') || filePath.endsWith('.js')) return 'code';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.md')) return 'docs';
    return 'other';
  }

  /**
   * Get current batch statistics
   */
  getBatchStats(): {
    pendingChanges: number;
    activeBatches: number;
    activeTimers: number;
  } {
    return {
      pendingChanges: this.pendingChanges.size,
      activeBatches: this.batches.size,
      activeTimers: this.debounceTimers.size + this.batchTimers.size
    };
  }

  /**
   * Force process all pending batches
   */
  async flushAll(): Promise<void> {
    this.logger.info('Flushing all pending batches');

    // Process all debounced changes immediately
    const pendingKeys = Array.from(this.pendingChanges.keys());
    for (const key of pendingKeys) {
      const event = this.pendingChanges.get(key);
      if (event) {
        const priority = this.determinePriority(event);
        await this.processDebounced(key, priority);
      }
    }

    // Process all active batches
    const batchKeys = Array.from(this.batches.keys());
    for (const batchKey of batchKeys) {
      await this.processBatch(batchKey, 'normal');
    }

    // Clear all timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    this.debounceTimers.clear();
    this.batchTimers.clear();
  }

  /**
   * Shutdown the batcher
   */
  async shutdown(): Promise<void> {
    await this.flushAll();
    this.logger.info('File change batcher shutdown complete');
  }
}