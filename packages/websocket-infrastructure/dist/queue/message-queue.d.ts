import { MessageQueueItem } from '../types/index.js';
import { EventEmitter } from 'events';
interface QueueConfig {
    maxSize: number;
    ttl: number;
    processingInterval: number;
    maxRetries: number;
}
export declare class MessageQueue extends EventEmitter {
    private readonly logger;
    private queue;
    private priorityQueue;
    private processingInterval?;
    private readonly config;
    private isProcessing;
    constructor(config?: Partial<QueueConfig>);
    start(): void;
    stop(): void;
    enqueue(channel: string, data: any, priority?: number): string;
    dequeue(): MessageQueueItem | undefined;
    get(messageId: string): MessageQueueItem | undefined;
    remove(messageId: string): boolean;
    retry(messageId: string): boolean;
    private processQueue;
    private insertIntoPriorityQueue;
    private findOldestMessage;
    private cleanupExpiredMessages;
    size(): number;
    getStats(): {
        size: number;
        maxSize: number;
        utilizationPercent: number;
        averageAge: number;
        oldestAge: number;
    };
    clear(): void;
    destroy(): void;
}
export {};
//# sourceMappingURL=message-queue.d.ts.map