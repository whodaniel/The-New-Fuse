export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  BLOCKED = "blocked",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export enum TaskType {
  GENERAL = "general",
  BUG = "bug",
  FEATURE = "feature",
  IMPROVEMENT = "improvement",
  MAINTENANCE = "maintenance",
  DOCUMENTATION = "documentation"
}
