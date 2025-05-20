import type { JsonValue } from './core/base-types.js';

export type TaskStatusType = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskPriorityType = 'low' | 'medium' | 'high' | 'critical';
export type TaskTypeValue = 'feature' | 'bug' | 'improvement' | 'documentation';

export interface TaskMetadata {
  labels?: string[];
  customFields?: Record<string, JsonValue>;
}

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'requires' | 'relates_to';
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
  type: TaskTypeValue;
  metadata?: TaskMetadata;
  dependencies?: TaskDependency[];
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  id: string;
}

export interface TaskService {
  createTask(task: CreateTaskDto): Promise<string>;
  updateTask(task: UpdateTaskDto): Promise<void>;
  deleteTask(id: string): Promise<void>;
  getTask(id: string): Promise<TaskResult>;
  queryTasks(query: TaskQuery): Promise<TaskResult[]>;
}

export interface TaskQuery {
  status?: TaskStatusType[];
  priority?: TaskPriorityType[];
  type?: TaskTypeValue[];
  filter?: TaskFilter;
  sort?: 'created' | 'updated' | 'priority';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TaskResult extends CreateTaskDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilter {
  search?: string;
  labels?: string[];
  assignee?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}