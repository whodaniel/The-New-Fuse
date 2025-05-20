/**
 * Agent capability enum
 * Defines the capabilities that agents can have
 */
export enum AgentCapability {
  CODE_GENERATION = "code_generation",
  CODE_REVIEW = "code_review",
  ARCHITECTURE_DESIGN = "architecture_design",
  TESTING = "testing",
  DOCUMENTATION = "documentation",
  OPTIMIZATION = "optimization",
  SECURITY_AUDIT = "security_audit",
  PROJECT_MANAGEMENT = "project_management",
  COMMUNICATION = "communication",
  TASK_PROCESSING = "task_processing",
  COLLABORATION = "collaboration",
  MATH_SOLVING = "math_solving",
  CODE_ANALYSIS = "code_analysis",
  NATURAL_LANGUAGE = "natural_language"
}

/**
 * Agent role enum
 * Defines the roles that agents can have
 */
export enum AgentRole {
  ASSISTANT = "assistant",
  WORKER = "worker",
  SUPERVISOR = "supervisor",
  SPECIALIST = "specialist",
  COORDINATOR = "coordinator",
  ANALYST = "analyst"
}

/**
 * Agent status enum
 * Defines the possible statuses of an agent
 */
export enum AgentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  DELETED = "DELETED",
  INITIALIZING = "INITIALIZING",
  READY = "READY",
  BUSY = "BUSY",
  ERROR = "ERROR",
  TERMINATED = "TERMINATED"
}
