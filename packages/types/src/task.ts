import { TaskPriority } from './core/enums.js';

export const TaskType = {
  ANALYSIS: 'ANALYSIS',
  IMPLEMENTATION: 'IMPLEMENTATION',
  REVIEW: 'REVIEW',
  TEST: 'TEST',
  DEPLOY: 'DEPLOY'
} as const;

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface TaskMetadata {
  description?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  dependencies?: TaskDependency[];
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
  tags?: string[];
  duration: string;
  viewCount: number;
  likeCount: number;
}

export interface TaskDependency {
  taskId: string;
  type: 'REQUIRED' | 'OPTIONAL';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: keyof typeof TaskType;  // Changed from typeof TaskType
  metadata: TaskMetadata;
  dependencies?: TaskDependency[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  type?: keyof typeof TaskType;
  dueDate?: Date;
  assigneeId?: string;
  dependencies?: string[];
  metadata?: TaskMetadata;
}

export interface UpdateTaskDto {
  status?: TaskStatus;
  completedAt?: Date | null;
  error?: string | null;
  [key: string]: unknown;
}

export enum MessageType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface TaskService {
  process(data: Record<string, unknown>): Promise<void>;
  create(task: CreateTaskDto): Promise<Task>;
  update(id: string, data: Partial<Task>): Promise<Task>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Task | null>;
  findAll(query?: TaskQuery): Promise<Task[]>;
  execute(id: string): Promise<TaskResult>;
  cancel(id: string): Promise<void>;
  retry(id: string): Promise<void>;
}

export interface TaskQuery {
  status?: TaskStatus;
  type?: keyof typeof TaskType;
  priority?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TaskResult {
  id: string;
  taskId: string;
  status: TaskStatus;
  output?: Record<string, unknown>;
  error?: string;
  metrics: {
    duration: number;
    resourceUsage: {
      cpuUsage: number;
      memoryUsage: number;
    };
  };
  timestamp: Date;
}

// Add any additional task-related types here
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: keyof typeof TaskType[];
  assigneeId?: string;
  fromDate?: Date;
  toDate?: Date;
}

// Type aliases for backward compatibility
export type TaskStatusType = TaskStatus;
export type TaskPriorityType = TaskPriority;
export type TaskTypeValue = keyof typeof TaskType;
