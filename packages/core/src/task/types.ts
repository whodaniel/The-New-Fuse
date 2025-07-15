export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export type TaskStatusType = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'scheduled' 
  | 'in_progress';

export interface Task {
  id: string;
  status: TaskStatusType;
  type: string;
  data: any;
  params?: Record<string, any>;
  config?: Record<string, any>;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskMetadata {
  id: string;
  type: string;
  status: TaskStatusType;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  dependencies: string[];
  maxRetries: number;
  currentRetry: number;
}

export interface TaskCreationOptions {
  type: string;
  data: any;
  params?: Record<string, any>;
  config?: Record<string, any>;
  priority?: number;
  dependencies?: string[];
  maxRetries?: number;
  timeout?: number;
}

export interface TaskExecutionOptions {
  queue?: boolean;
  priority?: number;
  timeout?: number;
}

export interface TaskQueueOptions {
  concurrency?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TaskQueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  taskOptions: TaskCreationOptions;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}