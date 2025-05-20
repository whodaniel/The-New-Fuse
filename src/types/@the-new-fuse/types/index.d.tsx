export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum TaskType {
  ROUTINE = "routine",
  ONETIME = "onetime",
  RECURRING = "recurring",
  DEPENDENT = "dependent",
  BACKGROUND = "background",
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  dueDate?: Date;
  assigneeId?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
  progress?: number;
  createdBy: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: string;
  type?: string;
  dueDate?: Date;
  assigneeId?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface User {
  token?: string;
  token?: string;
  id: string;
  email: string;
  password?: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: string;
  steps: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
