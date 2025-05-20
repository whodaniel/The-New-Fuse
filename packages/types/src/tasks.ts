import type { Agent } from './agent.js';
import { TaskStatus, TaskPriority, TaskType } from './core/enums.js';
import type { BaseEntity, UnknownRecord, UUID } from './core/index.js';

// Re-export enums as types for easier usage
export type TaskStatusType = TaskStatus;
export type TaskPriorityType = TaskPriority;
export type TaskTypeValue = TaskType;

/**
 * Represents metadata associated with a task.
 */
export interface TaskMetadata extends UnknownRecord {
  estimatedDuration?: number; // in minutes or seconds, define unit convention
  complexity?: 'low' | 'medium' | 'high';
  tags?: string[];
}

/**
 * Represents a dependency between tasks.
 */
export interface TaskDependency {
  taskId: UUID;
  statusRequired?: TaskStatus; // e.g., must be COMPLETED before this task can start
}

/**
 * Represents a task within the system.
 */
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assignedTo?: UUID | null; // Agent ID or User ID
  parentTaskId?: UUID | null;
  subtasks?: Task[];
  dependencies?: TaskDependency[];
  metadata?: TaskMetadata;
  result?: unknown; // Store the outcome/result of the task
  logs?: string[]; // Optional logs or history
}

/**
 * Data Transfer Object for creating a new task.
 */
export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  type?: TaskType;
  assignedTo?: UUID | null;
  parentTaskId?: UUID | null;
  dependencies?: TaskDependency[];
  metadata?: TaskMetadata;
}

/**
 * Data Transfer Object for updating an existing task.
 */
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: UUID | null;
  metadata?: TaskMetadata;
  result?: unknown;
  addLogs?: string[];
  removeDependencies?: UUID[];
  addDependencies?: TaskDependency[];
}

/**
 * Interface for a service managing tasks.
 */
export interface TaskService {
  createTask(taskData: CreateTaskDto): Promise<Task>;
  getTaskById(taskId: UUID): Promise<Task | null>;
  updateTask(taskId: UUID, updates: UpdateTaskDto): Promise<Task | null>;
  deleteTask(taskId: UUID): Promise<boolean>;
  listTasks(filter?: TaskFilter): Promise<Task[]>;
  assignTask(taskId: UUID, agentId: UUID): Promise<Task | null>;
  completeTask(taskId: UUID, result: unknown): Promise<Task | null>;
}

/**
 * Represents query parameters for filtering tasks.
 */
export interface TaskQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assignedTo?: UUID | 'unassigned';
  parentTaskId?: UUID | 'none';
  hasDependencies?: boolean;
  search?: string; // Search term for title/description
  createdBefore?: Date;
  createdAfter?: Date;
  updatedBefore?: Date;
  updatedAfter?: Date;
  limit?: number;
  offset?: number;
  sortBy?: keyof Task;
  sortOrder?: 'asc' | 'desc';
}

// Alias for TaskQuery for consistency if needed elsewhere
export type TaskFilter = TaskQuery;

/**
 * Represents the result of a task execution or query.
 */
export interface TaskResult {
  success: boolean;
  message?: string;
  data?: unknown;
  taskId?: UUID;
}

// Re-export main types
export type { Agent };
