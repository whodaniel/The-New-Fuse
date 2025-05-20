import { ISODateTime, TaskPriority, TaskStatus, TaskType, UUID } from './task-types.js';
import { TaskMetadata } from './model.js';
export interface CreateTaskDto {
    id: UUID;
    title: string;
    description?: string;
    priority?: TaskPriority;
    type?: TaskType;
    dueDate?: ISODateTime;
    assigneeId?: UUID;
    dependencies?: UUID[];
    metadata?: Partial<TaskMetadata>;
    tags?: string[];
}
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    dueDate?: ISODateTime | null;
    assigneeId?: UUID | null;
    completedAt?: ISODateTime | null;
    error?: string | null;
    metadata?: Partial<TaskMetadata>;
    tags?: string[];
}
//# sourceMappingURL=dto.d.d.ts.map