export interface Task {
  id: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
  type: TaskTypeValue;
  metadata: TaskMetadata;
  dependencies?: TaskDependency[];
  result?: TaskResult;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type TaskStatusType = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type TaskPriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskTypeValue = 'SUGGESTION' | 'TRACKING' | 'ANALYSIS';

export interface TaskMetadata {
  title: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  tags?: string[];
  [key: string]: unknown;
}

export interface TaskDependency {
  taskId: string;
  type: 'BLOCKS' | 'DEPENDS_ON';
}

export interface TaskResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: Error;
}

export const TaskStatus: Record<string, TaskStatusType> = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

export const TaskPriority: Record<string, TaskPriorityType> = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const TaskType: Record<string, TaskTypeValue> = {
  SUGGESTION: 'SUGGESTION',
  TRACKING: 'TRACKING',
  ANALYSIS: 'ANALYSIS'
};
