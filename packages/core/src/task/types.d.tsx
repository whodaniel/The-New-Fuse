import { TaskStatus, TaskPriority, TaskMetadata } from '@the-new-fuse/types';
export { TaskStatus, TaskPriority, TaskMetadata } from '@the-new-fuse/types';
export type { Task, TaskTypeValue, TaskStatusType, TaskPriorityType } from '@the-new-fuse/types';
export declare const TaskType: {
    readonly GENERIC: "generic";
    readonly ANALYSIS: "analysis";
    readonly PROCESSING: "processing";
    readonly INTEGRATION: "integration";
};
export interface TaskResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}
export interface TaskDependency {
    taskId: string;
    type: 'REQUIRED' | 'OPTIONAL';
    condition?: string;
}
export interface TaskQuery {
    types?: typeof TaskType[];
    priorities?: TaskPriority[];
    statuses?: TaskStatus[];
    creator?: string;
    assignee?: string;
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    metadata?: Partial<TaskMetadata>;
}
export declare enum CoreTaskSpecificStatus {
    INITIALIZED = "INITIALIZED",
    AWAITING_RESOURCES = "AWAITING_RESOURCES",
    FINALIZING = "FINALIZING"
}
export declare interface CoreTaskConfig {
    priority: number;
    maxExecutionTime: number;
}
export type CoreTaskProcessor<TInput, TOutput> = (input: TInput, config: CoreTaskConfig) => Promise<TOutput>;
