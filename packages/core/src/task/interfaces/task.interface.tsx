import { TaskStatus, TaskPriority } from '../entities/Task.js';

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TaskStatistics {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  blocked: number;
  avgCompletionTime: number;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  activityType: TaskActivityType;
  metadata: Record<string, any>;
  createdAt: Date;
}

export enum TaskActivityType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED'
}

export interface TaskNotification {
  id: string;
  taskId: string;
  userId: string;
  type: TaskNotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
}

export enum TaskNotificationType {
  ASSIGNMENT = 'ASSIGNMENT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  DUE_DATE_APPROACHING = 'DUE_DATE_APPROACHING',
  MENTIONED = 'MENTIONED',
  COMMENT = 'COMMENT'
}
