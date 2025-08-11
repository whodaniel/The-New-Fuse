import { Task } from '../entities/Task';
export enum TaskEventType {
  // Implementation needed
}
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',
}

export enum TaskNotificationType {
  // Implementation needed
}
  ASSIGNMENT = 'ASSIGNMENT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  MENTIONED = 'MENTIONED',
  COMMENT = 'COMMENT',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  OVERDUE = 'OVERDUE',
}

export interface TaskEvent {
  // Implementation needed
}
  type: TaskEventType;
  task: Task;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface TaskNotification {
  // Implementation needed
}
  id: string;
  type: TaskNotificationType;
  taskId: string;
  userId: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilter {
  // Implementation needed
}
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  projectId?: string;
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  searchTerm?: string;
}

export interface TaskStatistics {
  // Implementation needed
}
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}