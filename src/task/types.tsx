import { JsonValue } from "@the-new-fuse/database/client/runtime/library";

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = 1,
  NORMAL = 2,
  MEDIUM = 3,
  HIGH = 4,
  CRITICAL = 5,
}

export enum TaskType {
  ANALYSIS = "analysis",
  CODE_REVIEW = "code_review",
  BUG_FIX = "bug_fix",
  FEATURE = "feature",
  DOCUMENTATION = "documentation",
  TEST = "test",
  OTHER = "other",
  GENERIC = "generic",
}

export interface TaskDependency {
  taskId: string;
  type: "hard" | "soft";
  condition?: string;
}

export interface TaskMetadata {
  description?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  dependencies?: TaskDependency[];
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
  tags?: string[];
  category?: string;
  priority?: TaskPriority;
  type?: TaskType;
  assignee?: string;
  reporter?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface Task {
  id: string;
  title: string;
  type: string;
  userId: string;
  status: string;
  priority: number;
  metadata: TaskMetadata;
  data: JsonValue;
  output: JsonValue;
  dependencies: JsonValue;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
