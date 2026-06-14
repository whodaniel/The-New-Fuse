import { EventEmitter } from 'events';
import { PerformanceMetrics, Task, TaskStatus, AgentInfo } from '../core/types.js';
/**
 * Detailed metrics for a time period
 */
export interface DetailedMetrics {
    period: {
        start: Date;
        end: Date;
    };
    tasks: {
        total: number;
        completed: number;
        failed: number;
        pending: number;
        inProgress: number;
        cancelled: number;
    };
    performance: {
        successRate: number;
        failureRate: number;
        averageExecutionTime: number;
        minExecutionTime: number;
        maxExecutionTime: number;
        p50ExecutionTime: number;
        p95ExecutionTime: number;
        p99ExecutionTime: number;
    };
    throughput: {
        tasksPerSecond: number;
        tasksPerMinute: number;
        tasksPerHour: number;
    };
    agents: {
        total: number;
        active: number;
        idle: number;
        offline: number;
        averageLoad: number;
        utilizationRate: number;
    };
    queue: {
        depth: number;
        averageWaitTime: number;
    };
}
/**
 * Task execution record
 */
interface TaskExecution {
    taskId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: TaskStatus;
    agentId?: string;
}
/**
 * Metrics collector for monitoring coordination system
 */
export declare class MetricsCollector extends EventEmitter {
    private taskExecutions;
    private completedExecutions;
    private startTime;
    private maxHistorySize;
    constructor(maxHistorySize?: number);
    /**
     * Record task started
     */
    recordTaskStarted(task: Task, agentId?: string): void;
    /**
     * Record task completed
     */
    recordTaskCompleted(taskId: string): void;
    /**
     * Record task failed
     */
    recordTaskFailed(taskId: string): void;
    /**
     * Add execution to history (with size limit)
     */
    private addToHistory;
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(activeAgents: AgentInfo[], queueDepth: number): PerformanceMetrics;
    /**
     * Get detailed metrics for a time period
     */
    getDetailedMetrics(startDate: Date, endDate: Date, agents: AgentInfo[]): DetailedMetrics;
    /**
     * Calculate percentile of execution times
     */
    private percentile;
    /**
     * Get metrics by agent
     */
    getAgentMetrics(agentId: string): {
        tasksCompleted: number;
        tasksFailed: number;
        averageExecutionTime: number;
        successRate: number;
    };
    /**
     * Get metrics summary
     */
    getSummary(): {
        uptime: number;
        totalTasksProcessed: number;
        currentlyProcessing: number;
        overallSuccessRate: number;
    };
    /**
     * Export metrics to JSON
     */
    exportMetrics(): {
        startTime: Date;
        completedExecutions: TaskExecution[];
        activeExecutions: TaskExecution[];
        summary: any;
    };
    /**
     * Clear all metrics
     */
    clear(): void;
    /**
     * Get recent execution history
     */
    getRecentHistory(count?: number): TaskExecution[];
}
export {};
//# sourceMappingURL=MetricsCollector.d.ts.map