/**
 * Workflow Types Index
 * Re-exports all workflow types
 */
export * from '../types/index.js';
export declare class WorkflowError extends Error {
    readonly code: string;
    readonly workflowId?: string | undefined;
    readonly stepId?: string | undefined;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, workflowId?: string | undefined, stepId?: string | undefined, details?: Record<string, unknown> | undefined);
}
export interface WorkflowMetrics {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecutionTime?: Date;
}
export interface WorkflowStepMetrics {
    stepId: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
}
export interface WorkflowExecutionOptions {
    timeout?: number;
    retryPolicy?: {
        maxAttempts: number;
        backoff: 'linear' | 'exponential';
        delay: number;
    };
    parallel?: boolean;
    maxConcurrency?: number;
}
export interface WorkflowTrigger {
    type: 'manual' | 'scheduled' | 'webhook' | 'event' | 'condition';
    config: Record<string, any>;
    enabled: boolean;
}
export interface WorkflowSchedule {
    cron: string;
    timezone: string;
    enabled: boolean;
    nextRun?: Date;
    lastRun?: Date;
}
//# sourceMappingURL=index.d.ts.map