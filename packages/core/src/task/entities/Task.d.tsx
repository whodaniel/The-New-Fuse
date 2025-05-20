export declare enum TaskStatus {
    BACKLOG = "BACKLOG",
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    IN_REVIEW = "IN_REVIEW",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class Task {
    : string;
    title: string;
    description: string;
    : TaskStatus;
    : TaskPriority;
    : string;
    tags: string[];
    : Date;
    completedAt: Date;
    : Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    parentTaskId: string;
    : number;
    actualHours: number;
    : boolean;
    blockReason: string;
}
