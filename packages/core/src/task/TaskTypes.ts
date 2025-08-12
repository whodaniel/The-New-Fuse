import { TaskStatusType, TaskPriorityType, TaskTypeValue, TaskMetadata, TaskDependency, Task } from '@the-new-fuse/types';
import { z } from 'zod';
export const TaskSchema = z.object({
  // Implementation needed
}
  type: z.enum(['REQUIRED', 'OPTIONAL', 'BACKGROUND']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  metadata: z.object({
  // Implementation needed
}
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.date().optional(),
  }),
  dependencies: z.array(z.string()).optional(),
});
export type TaskConfig = z.infer<typeof TaskSchema>;
export interface TaskExecutionContext {
  taskId: string;
  userId: string;
  workspaceId?: string;
  metadata?: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}