/**
 * Workflow Types Index
 * Re-exports all workflow types
 */

export * from '../types';
// Workflow-specific error class
export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly workflowId?: string,
    public readonly stepId?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

// Additional workflow-specific types
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
