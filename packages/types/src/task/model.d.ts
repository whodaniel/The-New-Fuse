import { BaseEntity, ISODateTime, TaskPriority, TaskStatus, TaskType, UUID } from './task-types.js';
export interface TaskMetadata {
    source: string;
    retryCount: number;
    lastError?: string;
    customData?: Record<string, unknown>;
}
export interface TaskDependency {
    taskId: UUID;
    type: 'REQUIRED' | 'OPTIONAL';
    status: TaskStatus;
}
export interface Task extends BaseEntity {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    dueDate?: ISODateTime;
    assigneeId?: UUID;
    completedAt?: ISODateTime;
    error?: string;
    metadata: TaskMetadata;
    tags: string[];
    dependencies: UUID[];
}
export interface TaskResult {
    id: UUID;
    taskId: UUID;
    status: TaskStatus;
    output?: Record<string, unknown>;
    error?: string;
    metrics: {
        duration: number;
        resourceUsage: {
            cpuUsage: number;
            memoryUsage: number;
        };
    };
    timestamp: ISODateTime;
}
export interface TaskQuery {
    status?: TaskStatus | TaskStatus[];
    type?: TaskType | TaskType[];
    priority?: TaskPriority | TaskPriority[];
    userId?: UUID;
    startDate?: ISODateTime;
    endDate?: ISODateTime;
    tags?: string[];
    assignee?: string;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=model.d.ts.map