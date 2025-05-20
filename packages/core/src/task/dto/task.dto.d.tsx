import { TaskStatus, TaskPriority } from '../entities/Task.js';
export declare class CreateTaskDto {
    : string;
    description: string;
    priority: TaskPriority;
    assignedTo?: string;
    tags?: string[];
    : Date;
    parentTaskId?: string;
    estimatedHours?: number;
    metadata?: Record<string, unknown>;
}
export declare class UpdateTaskDto {
    : string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    tags?: string[];
    : Date;
    estimatedHours?: number;
    actualHours?: number;
    isBlocked?: boolean;
    blockReason?: string;
    metadata?: Record<string, unknown>;
}
export declare class TaskFilterDto {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    : string;
    tags?: string[];
    dueBefore?: Date;
    dueAfter?: Date;
    includeCompleted?: boolean;
    page?: number;
    limit?: number;
}
