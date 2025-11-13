/**
 * Temporary database types for relay-core
 * This replaces the @the-new-fuse/database imports
 */
export declare enum AgentType {
    BASIC = "BASIC",
    CHAT = "CHAT",
    WORKFLOW = "WORKFLOW",
    TASK = "TASK",
    ASSISTANT = "ASSISTANT",
    ANALYSIS = "ANALYSIS",
    CONVERSATIONAL = "CONVERSATIONAL",
    IDE_EXTENSION = "IDE_EXTENSION",
    API = "API"
}
export declare enum AgentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    IDLE = "IDLE",
    BUSY = "BUSY",
    ERROR = "ERROR",
    OFFLINE = "OFFLINE",
    INITIALIZING = "INITIALIZING",
    READY = "READY",
    TERMINATED = "TERMINATED"
}
export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export interface PrismaClient {
    [key: string]: any;
}
//# sourceMappingURL=database.d.ts.map