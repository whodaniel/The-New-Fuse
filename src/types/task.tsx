export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export type TaskMetadata = Record<string, unknown>;

// Type aliases for backward compatibility
export type TaskStatusType = TaskStatus;
export type TaskPriorityType = TaskPriority;
export type TaskTypeValue = string;
