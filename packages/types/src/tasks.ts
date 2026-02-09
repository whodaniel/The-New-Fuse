export enum TaskStatusType {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

export enum TaskPriorityType {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export type TaskTypeValue = string;

export interface TaskMetadata {
  [key: string]: unknown;
}

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'requires';
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  type: TaskTypeValue;
  priority?: TaskPriorityType;
  metadata?: TaskMetadata;
  dependencies?: TaskDependency[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  metadata?: TaskMetadata;
  dependencies?: TaskDependency[];
}

export interface TaskService {
  create(dto: CreateTaskDto): Promise<any>;
  update(id: string, dto: UpdateTaskDto): Promise<any>;
  findById(id: string): Promise<any>;
  findAll(query?: TaskQuery): Promise<any[]>;
}

export interface TaskQuery {
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  type?: TaskTypeValue;
  assigneeId?: string;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TaskFilter {
  [key: string]: unknown;
}