import { TaskType, TaskPriority, TaskStatus, TaskDependency, TaskMetadata, TaskResult } from './types.js';
export declare class TaskEntity {
    : string;
    : typeof TaskType;
    : TaskPriority;
    : TaskStatus;
    dependencies: TaskDependency[];
    metadata: TaskMetadata;
    input: unknown;
    output?: TaskResult;
    : Date;
    updated: Date;
    : Date;
    started?: Date;
    : Date;
    searchVector: unknown;
    statusPriorityIdx: string;
    typeStatusIdx: string;
    metadataIdx: unknown;
}
