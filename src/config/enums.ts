// filepath: src/config/enums.ts

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
}

export enum TaskType {
  ROUTINE = "routine",
  ONETIME = "onetime",
  RECURRING = "recurring",
  DEPENDENT = "dependent",
  BACKGROUND = "background",
  USER_INITIATED = "user_initiated",
  SYSTEM = "system",
}

export enum MetricUnit {
  COUNT = "count",
  BYTES = "bytes",
  SECONDS = "seconds",
  MILLISECONDS = "milliseconds",
  PERCENTAGE = "percentage",
  NONE = "none",
}

export enum SecurityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  DATABASE = "database",
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  BUSINESS = "business",
  SYSTEM = "system",
}

export enum AssetCategory {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
  MODEL = "model",
  COMPONENT = "component",
}
