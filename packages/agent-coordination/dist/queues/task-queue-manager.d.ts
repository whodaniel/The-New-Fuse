import { EventEmitter } from 'events';
import { Queue } from 'bullmq';
import { PersistentMetricsCollector } from '../monitoring/PersistentMetricsCollector.js';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import type { MessageSerializer } from '../serializers/message-serializer.js';
import type { AgentTask, QueueConfig, TaskProcessor } from '../types/coordination.types';
/**
 * Task queue manager using BullMQ
 */
export declare class TaskQueueManager extends EventEmitter {
    private readonly redisService;
    private readonly defaultConfig;
    private readonly metricsCollector?;
    private readonly logger;
    private readonly queues;
    private readonly workers;
    private readonly queueEvents;
    private readonly processors;
    private readonly serializer;
    private readonly redisConnection;
    constructor(redisService: UnifiedRedisService, serializer: MessageSerializer, defaultConfig?: Partial<QueueConfig>, metricsCollector?: PersistentMetricsCollector | undefined);
    /**
     * Create or get a queue
     */
    createQueue(name: string, config?: Partial<QueueConfig>): Promise<Queue>;
    /**
     * Register task processor
     */
    registerProcessor(queueName: string, processor: TaskProcessor, config?: Partial<QueueConfig>): Promise<void>;
    /**
     * Add task to queue
     */
    addTask(queueName: string, task: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<AgentTask>;
    /**
     * Get task status
     */
    getTaskStatus(queueName: string, taskId: string): Promise<AgentTask | null>;
    /**
     * Cancel task
     */
    cancelTask(queueName: string, taskId: string): Promise<boolean>;
    /**
     * Retry failed task
     */
    retryTask(queueName: string, taskId: string): Promise<boolean>;
    /**
     * Get queue statistics
     */
    getQueueStats(queueName: string): Promise<any>;
    /**
     * Pause queue
     */
    pauseQueue(queueName: string): Promise<void>;
    /**
     * Resume queue
     */
    resumeQueue(queueName: string): Promise<void>;
    /**
     * Clean queue (remove completed/failed jobs)
     */
    cleanQueue(queueName: string, grace?: number, status?: 'completed' | 'failed'): Promise<number>;
    /**
     * Close all queues and workers
     */
    close(): Promise<void>;
    /**
     * Map A2A priority to BullMQ priority number
     */
    private mapPriorityToNumber;
    /**
     * Setup queue event handlers
     */
    private setupQueueEventHandlers;
    /**
     * Listen for stalled tasks
     */
    onTaskStalled(callback: (jobId: string, queueName: string) => void): void;
    /**
     * Fail active and waiting tasks for a specific agent
     */
    failTasksForAgent(queueName: string, agentId: string, reason: string): Promise<number>;
}
//# sourceMappingURL=task-queue-manager.d.ts.map