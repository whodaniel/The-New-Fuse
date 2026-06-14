import { z } from 'zod';
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        REQUIRED: "REQUIRED";
        OPTIONAL: "OPTIONAL";
        BACKGROUND: "BACKGROUND";
    }>;
    priority: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>;
    status: z.ZodEnum<{
        RUNNING: "RUNNING";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
        PENDING: "PENDING";
        CANCELLED: "CANCELLED";
    }>;
    data: z.ZodAny;
    metadata: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        dueDate: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type Task = z.infer<typeof TaskSchema>;
export interface TaskExecutionContext {
    taskId: string;
    userId: string;
    workspaceId?: string;
    metadata?: Record<string, any>;
}
export interface TaskResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=TaskTypes.d.ts.map