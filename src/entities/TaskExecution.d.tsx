import { User } from './User.js';
import { Task } from './Task.js';
export declare class TaskExecution {
  id: string;
  task: Task;
  taskId: string;
  status: string;
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
  executedByUser?: User;
  executedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
