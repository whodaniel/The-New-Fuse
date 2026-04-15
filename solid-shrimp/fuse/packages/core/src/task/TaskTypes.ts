import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['REQUIRED', 'OPTIONAL', 'BACKGROUND']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  data: z.any(),
  metadata: z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.date().optional(),
  }),
  dependencies: z.array(z.string()).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export interface TaskExecutionContext {
  taskId: string;
  userId: string;
  workspaceId?: string;
  metadata?: Record<string, any>;
}

export interface TaskResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}
