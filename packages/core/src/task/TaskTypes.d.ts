import { TaskStatusType, TaskPriorityType, TaskTypeValue, TaskMetadata, TaskDependency, Task } from '@the-new-fuse/types';
import { z } from 'zod';
export declare const TaskValidationSchema: z.string;
export type { Task, TaskStatusType, TaskPriorityType, TaskTypeValue, TaskMetadata, TaskDependency };
export declare const TaskSchema: z.ZodObject<z.ZodRawShape, "strip", z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
