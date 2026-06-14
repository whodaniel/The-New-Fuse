import { Job, JobOptions } from 'bull';
import { EventEmitter } from 'events';
import { Task, TaskPriority, TaskStatus } from './types.js';
/**
 * Priority-based task queue using Bull
 */
export declare class TaskQueue extends EventEmitter {
    private queues;
    private redisConfig;
    constructor(redisUrl?: string);
    /**
     * Initialize priority queues
     */
    private initializeQueues;
    /**
     * Add a task to the queue
     */
    addTask(task: Task, options?: JobOptions): Promise<Job<Task>>;
    /**
     * Get next available task based on priority
     */
    getNextTask(): Promise<Task | null>;
    /**
     * Get task by ID
     */
    getTask(taskId: string): Promise<Task | null>;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
    /**
     * Cancel a task
     */
    cancelTask(taskId: string): Promise<boolean>;
    /**
     * Get queue statistics
     */
    getStatistics(): Promise<{
        priority: TaskPriority;
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }[]>;
    /**
     * Get total queue depth
     */
    getQueueDepth(): Promise<number>;
    /**
     * Pause all queues
     */
    pauseAll(): Promise<void>;
    /**
     * Resume all queues
     */
    resumeAll(): Promise<void>;
    /**
     * Clean completed/failed jobs
     */
    clean(grace?: number): Promise<void>;
    /**
     * Close all queues
     */
    close(): Promise<void>;
}
//# sourceMappingURL=TaskQueue.d.ts.map