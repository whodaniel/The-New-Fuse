/**
 * BuildProcessThrottler - Manages build process queue with memory-aware scheduling
 */
import { EventEmitter } from 'events';
import { MemoryUsage } from '../types/index.js';
export interface BuildTask {
    id: string;
    command: string;
    args: string[];
    cwd?: string;
    env?: Record<string, string>;
    memoryLimit?: number;
    priority?: number;
    timeout?: number;
}
export interface BuildTaskResult {
    id: string;
    success: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    duration: number;
    memoryUsed?: number;
    error?: Error;
}
export interface ThrottlerOptions {
    maxConcurrency: number;
    memoryThreshold: number;
    defaultTimeout: number;
    processMemoryLimit: number;
    queueTimeout: number;
}
export declare class BuildProcessThrottler extends EventEmitter {
    private queue;
    private running;
    private results;
    private options;
    private isShuttingDown;
    constructor(options?: Partial<ThrottlerOptions>);
    /**
     * Add a build task to the queue
     */
    addTask(task: BuildTask): Promise<string>;
    /**
     * Get the result of a completed task
     */
    getTaskResult(taskId: string): BuildTaskResult | undefined;
    /**
     * Wait for a task to complete and return its result
     */
    waitForTask(taskId: string, timeout?: number): Promise<BuildTaskResult>;
    /**
     * Cancel a queued task
     */
    cancelTask(taskId: string): boolean;
    /**
     * Update concurrency limit
     */
    setMaxConcurrency(maxConcurrency: number): void;
    /**
     * Update memory threshold
     */
    setMemoryThreshold(memoryThreshold: number): void;
    /**
     * Check if system has enough memory to start new processes
     */
    hasAvailableMemory(currentMemoryUsage: MemoryUsage, requiredMemory?: number): Promise<boolean>;
    /**
     * Get current throttler status
     */
    getStatus(): {
        queueLength: number;
        runningCount: number;
        completedCount: number;
        maxConcurrency: number;
        isShuttingDown: boolean;
    };
    /**
     * Gracefully shutdown all processes
     */
    shutdown(timeout?: number): Promise<void>;
    /**
     * Process the task queue
     */
    private processQueue;
    /**
     * Start a build task
     */
    private startTask;
    /**
     * Kill a running process
     */
    private killProcess;
    /**
     * Clear completed task results to free memory
     */
    clearResults(): void;
    /**
     * Get all task results
     */
    getAllResults(): BuildTaskResult[];
    /**
     * Get running task IDs
     */
    getRunningTaskIds(): string[];
    /**
     * Get queued task IDs
     */
    getQueuedTaskIds(): string[];
}
//# sourceMappingURL=BuildProcessThrottler.d.ts.map