import { Task } from './index.js';
import { TaskStatus, TaskPriority, TaskType } from './types/enums.js';

export class TaskModel implements Task {
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

  constructor(task: Partial<Task>) {
    this.id = task.id || "";
    this.title = task.title || "";
    this.description = task.description;
    this.status = task.status || TaskStatus.TODO;
    this.priority = task.priority || TaskPriority.MEDIUM;
    this.type = task.type || TaskType.GENERAL;
    this.createdAt = task.createdAt || new Date();
    this.updatedAt = task.updatedAt || new Date();
    this.dueDate = task.dueDate;
    this.assignedTo = task.assignedTo;
    this.createdBy = task.createdBy || "";
    this.metadata = task.metadata;
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return this.dueDate < new Date() && this.status !== TaskStatus.COMPLETED;
  }

  isAssigned(): boolean {
    return !!this.assignedTo;
  }

  toJSON(): Record<string, any> {
    return {
      ...this,
      isOverdue: this.isOverdue(),
      isAssigned: this.isAssigned()
    };
  }
}
