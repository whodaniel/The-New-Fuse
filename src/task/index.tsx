// Re-export all Task-related types
export * from './types/enums.js';
export * from './model.js';
export * from './task-types.js';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  assignedTo?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: string;
  type?: string;
  dueDate?: Date;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
}
