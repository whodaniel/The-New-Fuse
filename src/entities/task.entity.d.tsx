export interface Task extends BaseEntity {
  name: string;
  description?: string;
  status: string;
  type: string;
  priority: number;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: string;
  metadata?: Record<string, any>;
  parentId?: string;
}
export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: unknown;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  startTime: Date;
  endTime: Date;
  duration: number;
  metadata?: Record<string, any>;
}
