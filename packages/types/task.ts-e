export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskType {
  ROUTINE = 'routine',
  ONETIME = 'onetime',
  RECURRING = 'recurring',
  DEPENDENT = 'dependent',
  BACKGROUND = 'background'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  input: TaskInput;
  output?: TaskOutput;
  execution?: TaskExecution;
  error?: string;
  retries?: number;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskInput {
  prompt: string;
  context?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
}

export interface TaskOutput {
  result: unknown;
  metadata?: Record<string, unknown>;
}

export interface TaskExecution {
  id: string;
  startTime: number;
  endTime?: number;
  status: TaskStatus;
  priority: TaskPriority;
  retries: number;
  error?: string;
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
