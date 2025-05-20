// Define our task-related types instead of importing from @the-new-fuse/types
// This helps avoid circular dependencies and provides direct type access

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  RUNNING = 'running'
}

export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

export const TaskType = {
  GENERIC: 'generic',
  ANALYSIS: 'analysis',
  PROCESSING: 'processing',
  INTEGRATION: 'integration'
} as const;

export type TaskTypeValue = typeof TaskType[keyof typeof TaskType];
export type TaskStatusType = keyof typeof TaskStatus;
export type TaskPriorityType = keyof typeof TaskPriority;

export interface TaskMetadata {
  createdBy?: string;
  assignedTo?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  tags?: string[];
  resourceUsage?: {
    cpu?: number;
    memory?: number;
    storage?: number;
  };
  retryCount?: number;
  lastError?: string;
}

export interface Task<T = any> {
  id: string;
  payload: T;
  priority?: number;
  retries?: number;
  timeout?: number;
  execute: () => Promise<any>;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
  result?: any;
  type?: string;
  dependencies?: TaskDependency[];
  metadata?: TaskMetadata;
  scheduled?: Date;
}

export interface TaskResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface TaskDependency {
  taskId: string;
  type: 'hard' | 'soft';
  condition?: string;
}

export interface TaskQuery {
  types?: Array<string>;
  priorities?: Array<number>;
  statuses?: Array<string>;
  creator?: string;
  assignee?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  metadata?: Partial<TaskMetadata>;
}

export enum CoreTaskSpecificStatus {
  INITIALIZED = 'INITIALIZED',
  AWAITING_RESOURCES = 'AWAITING_RESOURCES',
  FINALIZING = 'FINALIZING',
}

export interface CoreTaskConfig {
  priority: number;
  maxExecutionTime: number; // in milliseconds
}

export type CoreTaskProcessor<TInput, TOutput> = (
  input: TInput,
  config: CoreTaskConfig
) => Promise<TOutput>;

// Example of a type that might involve JSX if this file is truly .tsx for UI reasons
// import * as React from 'react';
// export interface TaskStatusIndicatorProps {
//   status: CoreTaskSpecificStatus;
// }
// export function TaskStatusIndicator({ status }: TaskStatusIndicatorProps): React.ReactElement {
//   return <div>Status: {status}</div>;
// }
