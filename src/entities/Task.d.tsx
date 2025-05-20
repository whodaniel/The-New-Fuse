import { User } from './User.js';
import { TaskExecution } from './TaskExecution.js';
export declare class Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  assignedUser?: User;
  assignedTo?: string;
  createdByUser?: User;
  createdBy: string;
  dueDate?: Date;
  metadata?: Record<string, any>;
  executions?: TaskExecution[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
