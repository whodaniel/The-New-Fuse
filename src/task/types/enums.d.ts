export declare enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
}
export declare enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}
export declare enum TaskType {
  ROUTINE = "routine",
  ONETIME = "onetime",
  RECURRING = "recurring",
  DEPENDENT = "dependent",
  BACKGROUND = "background",
  USER_INITIATED = "user_initiated",
  SYSTEM = "system",
}
