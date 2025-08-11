export enum TaskStatus {
  // Implementation needed
}
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
  queue?: boolean;
  priority?: number;
  timeout?: number;
}

export interface TaskQueueOptions {
  // Implementation needed
}
  concurrency?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TaskQueueStats {
  // Implementation needed
}
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface ScheduledTask {
  // Implementation needed
}
  id: string;
  name: string;
  cron: string;
  taskOptions: TaskCreationOptions;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}