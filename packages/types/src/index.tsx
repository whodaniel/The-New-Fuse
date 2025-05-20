// Export all service types
export * from './services.js';

// Re-export existing types
export * from './task.js';

// Export feature types
export * from './feature.js';

// Export context types
export * from './context.js';

// Unified task type definitions
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskType {
  ROUTINE = 'routine',
  ONETIME = 'onetime',
  RECURRING = 'recurring',
  DEPENDENT = 'dependent',
  BACKGROUND = 'background',
  GENERIC = 'generic'
}

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];
export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];
export type TaskTypeValue = typeof TaskType[keyof typeof TaskType];

export interface TaskMetadata {
  description?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  dependencies?: string[];
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
}
