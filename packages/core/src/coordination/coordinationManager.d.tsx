export declare enum TaskPriority {
    LOW = 1,
    NORMAL = 2,
    HIGH = 3,
    URGENT = 4
}
export declare enum TaskState {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    BLOCKED = "blocked"
}
export interface TaskInfo {
    taskId: string;
    priority: TaskPriority;
    assignedAgent: string | null;
    state: TaskState;
    dependencies: Set<string>;
    startTime: Date | null;
    completionTime: Date | null;
    metadata: Record<string, unknown>;
}
export interface TaskHistoryEntry {
    timestamp: string;
    state: string;
    agent: string;
}
export declare class AgentInfo {
    readonly agentId: string;
    currentTasks: Set<string>;
    completedTasks: Set<string>;
    lastHeartbeat: Date;
    loadFactor: number;
    capabilities: Set<string>;
    status: string;
    constructor(agentId: string);
}
export declare class CoordinationManager {
    private tasks;
    private agents;
    private taskLocks;
    private readonly heartbeatInterval;
    private readonly maxAgentLoad;
    private taskHistory;
    constructor();
    private checkBlockedTasks;
}
