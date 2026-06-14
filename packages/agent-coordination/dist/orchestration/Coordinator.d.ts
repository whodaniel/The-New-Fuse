import { EventEmitter } from 'events';
import { CoordinationConfig, Task, TaskPriority, TaskResult } from '../core/types.js';
/**
 * Master coordinator for multi-agent task execution
 */
export declare class Coordinator extends EventEmitter {
    private taskQueue;
    private taskAssigner;
    private agentPool;
    private activeTasks;
    private taskResults;
    private isRunning;
    private processingInterval?;
    constructor(redisUrl: string, agentPoolConfig: any, coordinationConfig?: CoordinationConfig);
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Start the coordinator
     */
    start(): Promise<void>;
    /**
     * Stop the coordinator
     */
    stop(): Promise<void>;
    /**
     * Submit a task for execution
     */
    submitTask(type: string, payload: any, options?: {
        priority?: TaskPriority;
        requiredCapabilities?: string[];
        dependencies?: Task['dependencies'];
        timeout?: number;
        maxRetries?: number;
        metadata?: Record<string, any>;
    }): Promise<Task>;
    /**
     * Submit multiple tasks (batch submission)
     */
    submitTasks(tasks: Array<{
        type: string;
        payload: any;
        options?: any;
    }>): Promise<Task[]>;
    /**
     * Process next available task
     */
    private processNextTask;
    /**
     * Execute a task on an agent
     */
    private executeTask;
    /**
     * Handle task completion
     */
    private handleTaskCompleted;
    /**
     * Handle task failure
     */
    private handleTaskFailed;
    /**
     * Handle agent timeout
     */
    private handleAgentTimeout;
    /**
     * Check if task dependencies are met
     */
    private checkDependencies;
    /**
     * Check pending tasks that may now have dependencies met
     */
    private checkPendingDependencies;
    /**
     * Report task result (called by agents)
     */
    reportTaskResult(result: TaskResult): Promise<void>;
    /**
     * Get task by ID
     */
    getTask(taskId: string): Task | undefined;
    /**
     * Get all active tasks
     */
    getActiveTasks(): Task[];
    /**
     * Get coordinator statistics
     */
    getStatistics(): Promise<{
        queue: {
            priority: TaskPriority;
            waiting: number;
            active: number;
            completed: number;
            failed: number;
        }[];
        pool: {
            totalAgents: number;
            idleAgents: number;
            busyAgents: number;
            offlineAgents: number;
            totalCapacity: number;
            usedCapacity: number;
            utilizationRate: number;
        };
        assignments: {
            totalAssignments: number;
            activeAssignments: number;
            assignmentsByAgent: Map<string, number>;
        };
        activeTasks: number;
        completedTasks: number;
    }>;
    /**
     * Emergency stop all tasks
     */
    emergencyStop(): Promise<void>;
    /**
     * Cleanup
     */
    close(): Promise<void>;
}
//# sourceMappingURL=Coordinator.d.ts.map