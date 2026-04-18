import { Injectable, Logger } from '@nestjs/common';
import { MessageQueueItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

interface QueueConfig {
  maxSize: number;
  ttl: number;
  processingInterval: number;
  maxRetries: number;
}

@Injectable()
export class MessageQueue extends EventEmitter {
  private readonly logger = new Logger(MessageQueue.name);
  private queue: Map<string, MessageQueueItem> = new Map();
  private priorityQueue: MessageQueueItem[] = [];
  private processingInterval?: NodeJS.Timeout;
  private readonly config: QueueConfig;
  private isProcessing: boolean = false;

  constructor(config?: Partial<QueueConfig>) {
    super();
    this.config = {
      maxSize: config?.maxSize ?? 10000,
      ttl: config?.ttl ?? 3600000, // 1 hour
      processingInterval: config?.processingInterval ?? 100,
      maxRetries: config?.maxRetries ?? 3,
    };
  }

  /**
   * Start processing queue
   */
  public start(): void {
    if (this.processingInterval) {
      this.logger.warn('Queue processing already started');
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);

    this.logger.log('Message queue started');
  }

  /**
   * Stop processing queue
   */
  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.logger.log('Message queue stopped');
  }

  /**
   * Enqueue a message
   */
  public enqueue(channel: string, data: any, priority: number = 0): string {
    if (this.queue.size >= this.config.maxSize) {
      this.logger.warn(`Queue size limit reached: ${this.config.maxSize}`);
      this.emit('queue:full', { size: this.queue.size });

      // Remove oldest message
      const oldest = this.findOldestMessage();
      if (oldest) {
        this.queue.delete(oldest.id);
        this.emit('message:dropped', oldest);
      }
    }

    const messageId = uuidv4();
    const item: MessageQueueItem = {
      id: messageId,
      channel,
      data,
      timestamp: new Date(),
      retries: 0,
      maxRetries: this.config.maxRetries,
      priority,
    };

    this.queue.set(messageId, item);
    this.insertIntoPriorityQueue(item);

    this.logger.debug(
      `Message enqueued: ${messageId} (Channel: ${channel}, Priority: ${priority})`
    );
    this.emit('message:enqueued', item);

    return messageId;
  }

  /**
   * Dequeue a message
   */
  public dequeue(): MessageQueueItem | undefined {
    if (this.priorityQueue.length === 0) {
      return undefined;
    }

    const item = this.priorityQueue.shift();
    if (item) {
      this.queue.delete(item.id);
      this.emit('message:dequeued', item);
    }

    return item;
  }

  /**
   * Get message by ID
   */
  public get(messageId: string): MessageQueueItem | undefined {
    return this.queue.get(messageId);
  }

  /**
   * Remove message from queue
   */
  public remove(messageId: string): boolean {
    const item = this.queue.get(messageId);
    if (!item) {
      return false;
    }

    this.queue.delete(messageId);

    // Remove from priority queue
    const index = this.priorityQueue.findIndex((i) => i.id === messageId);
    if (index !== -1) {
      this.priorityQueue.splice(index, 1);
    }

    this.emit('message:removed', item);
    return true;
  }

  /**
   * Mark message as failed and retry
   */
  public retry(messageId: string): boolean {
    const item = this.queue.get(messageId);
    if (!item) {
      return false;
    }

    item.retries++;

    if (item.retries >= item.maxRetries) {
      this.logger.error(`Message ${messageId} exceeded max retries (${item.maxRetries})`);
      this.queue.delete(messageId);
      this.emit('message:failed', item);
      return false;
    }

    this.logger.debug(`Retrying message ${messageId} (Attempt ${item.retries}/${item.maxRetries})`);
    this.emit('message:retry', item);

    return true;
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.priorityQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Clean up expired messages
      this.cleanupExpiredMessages();

      // Process messages
      const item = this.dequeue();
      if (item) {
        this.emit('message:process', item);
      }
    } catch (error) {
      this.logger.error(`Error processing queue: ${error}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Insert message into priority queue
   */
  private insertIntoPriorityQueue(item: MessageQueueItem): void {
    // Insert in order of priority (higher priority first)
    let insertIndex = this.priorityQueue.length;
    for (let i = 0; i < this.priorityQueue.length; i++) {
      if (item.priority > this.priorityQueue[i].priority) {
        insertIndex = i;
        break;
      }
    }

    this.priorityQueue.splice(insertIndex, 0, item);
  }

  /**
   * Find oldest message in queue
   */
  private findOldestMessage(): MessageQueueItem | undefined {
    let oldest: MessageQueueItem | undefined;

    for (const item of this.queue.values()) {
      if (!oldest || item.timestamp < oldest.timestamp) {
        oldest = item;
      }
    }

    return oldest;
  }

  /**
   * Cleanup expired messages
   */
  private cleanupExpiredMessages(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, item] of this.queue.entries()) {
      const age = now - item.timestamp.getTime();
      if (age > this.config.ttl) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      const item = this.queue.get(id);
      this.queue.delete(id);

      // Remove from priority queue
      const index = this.priorityQueue.findIndex((i) => i.id === id);
      if (index !== -1) {
        this.priorityQueue.splice(index, 1);
      }

      if (item) {
        this.logger.debug(`Message ${id} expired (Age: ${now - item.timestamp.getTime()}ms)`);
        this.emit('message:expired', item);
      }
    }

    if (toRemove.length > 0) {
      this.logger.log(`Cleaned up ${toRemove.length} expired messages`);
    }
  }

  /**
   * Get queue size
   */
  public size(): number {
    return this.queue.size;
  }

  /**
   * Get queue statistics
   */
  public getStats() {
    const now = Date.now();
    let totalAge = 0;
    let oldestAge = 0;

    for (const item of this.queue.values()) {
      const age = now - item.timestamp.getTime();
      totalAge += age;
      if (age > oldestAge) {
        oldestAge = age;
      }
    }

    return {
      size: this.queue.size,
      maxSize: this.config.maxSize,
      utilizationPercent: (this.queue.size / this.config.maxSize) * 100,
      averageAge: this.queue.size > 0 ? totalAge / this.queue.size : 0,
      oldestAge,
    };
  }

  /**
   * Clear queue
   */
  public clear(): void {
    this.queue.clear();
    this.priorityQueue = [];
    this.logger.log('Queue cleared');
  }

  /**
   * Destroy queue
   */
  public destroy(): void {
    this.stop();
    this.clear();
  }
}
