import { TaskStatus, TaskType } from '../core.js';

/**
 * Data Transfer Object for creating a new task
 */
export interface TaskCreateDTO {
  title: string;
  description?: string;
  status: TaskStatus;
  type: typeof TaskType;
  assigneeId?: string;
  dueDate?: string;
}

/**
 * Data Transfer Object for updating an existing task
 */
export interface TaskUpdateDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  type?: typeof TaskType;
  assigneeId?: string;
  dueDate?: string;
}
