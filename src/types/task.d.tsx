export declare enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}
export declare enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}
export type TaskMetadata = Record<string, unknown>;
export type TaskStatusType = TaskStatus;
export type TaskPriorityType = TaskPriority;
export type TaskTypeValue = string;
