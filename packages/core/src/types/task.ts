import { TaskStatusType, TaskPriorityType, TaskTypeValue, TaskMetadata } from '@the-new-fuse/types';

export type TaskExecutionStatus = 'running' | 'completed' | 'failed' | 'pending' | 'cancelled';

export interface TaskLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface TaskQueueConfig {
  maxConcurrentTasks: number;
  processingStrategy: 'fifo' | 'lifo' | 'priority';
  retryAttempts: number;
  retryDelayMs: number;
}