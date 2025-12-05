import { z } from 'zod';
declare const nodeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strip>;
    data: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        status: z.ZodOptional<z.ZodEnum<{
            idle: "idle";
            running: "running";
            completed: "completed";
            failed: "failed";
        }>>;
        config: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
        onUpdate: z.ZodOptional<z.ZodFunction<z.core.$ZodFunctionArgs, z.core.$ZodFunctionOut>>;
    }, z.core.$strip>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    selected: z.ZodOptional<z.ZodBoolean>;
    positionAbsolute: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strip>>;
    dragging: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
declare const edgeSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    target: z.ZodString;
    sourceHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    targetHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodString>;
    animated: z.ZodOptional<z.ZodBoolean>;
    label: z.ZodOptional<z.ZodString>;
    style: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
}, z.core.$strip>;
declare const workflowSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>;
        data: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
            status: z.ZodOptional<z.ZodEnum<{
                idle: "idle";
                running: "running";
                completed: "completed";
                failed: "failed";
            }>>;
            config: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
            onUpdate: z.ZodOptional<z.ZodFunction<z.core.$ZodFunctionArgs, z.core.$ZodFunctionOut>>;
        }, z.core.$strip>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        selected: z.ZodOptional<z.ZodBoolean>;
        positionAbsolute: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>>;
        dragging: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    edges: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodString;
        target: z.ZodString;
        sourceHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        targetHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodString>;
        animated: z.ZodOptional<z.ZodBoolean>;
        label: z.ZodOptional<z.ZodString>;
        style: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
        data: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
    }, z.core.$strip>>;
    version: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
declare const workflowExecutionSchema: z.ZodObject<{
    id: z.ZodString;
    workflowId: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        aborted: "aborted";
        running: "running";
        completed: "completed";
        failed: "failed";
    }>;
    startTime: z.ZodNumber;
    endTime: z.ZodOptional<z.ZodNumber>;
    nodeResults: z.ZodRecord<z.ZodAny, z.core.SomeType>;
    error: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        totalExecutionTime: z.ZodOptional<z.ZodNumber>;
        nodeExecutionTimes: z.ZodOptional<z.ZodRecord<z.ZodNumber, z.core.SomeType>>;
        successRate: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Validates a workflow against the schema
 * @param workflow The workflow to validate
 * @returns The validated workflow or throws an error
 */
export declare function validateWorkflow(workflow: any): {
    id: string;
    name: string;
    nodes: {
        id: string;
        type: string;
        position: {
            x: number;
            y: number;
        };
        data: {
            type: string;
            name?: string | undefined;
            label?: string | undefined;
            status?: "idle" | "running" | "completed" | "failed" | undefined;
            config?: Record<any, unknown> | undefined;
            onUpdate?: z.core.$InferOuterFunctionType<z.core.$ZodFunctionArgs, z.core.$ZodFunctionOut> | undefined;
        };
        width?: number | undefined;
        height?: number | undefined;
        selected?: boolean | undefined;
        positionAbsolute?: {
            x: number;
            y: number;
        } | undefined;
        dragging?: boolean | undefined;
    }[];
    edges: {
        id: string;
        source: string;
        target: string;
        sourceHandle?: string | null | undefined;
        targetHandle?: string | null | undefined;
        type?: string | undefined;
        animated?: boolean | undefined;
        label?: string | undefined;
        style?: Record<any, unknown> | undefined;
        data?: Record<any, unknown> | undefined;
    }[];
    description?: string | undefined;
    version?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    isPublic?: boolean | undefined;
    tags?: string[] | undefined;
};
/**
 * Validates a workflow execution against the schema
 * @param execution The workflow execution to validate
 * @returns The validated workflow execution or throws an error
 */
export declare function validateWorkflowExecution(execution: any): {
    id: string;
    workflowId: string;
    status: "pending" | "aborted" | "running" | "completed" | "failed";
    startTime: number;
    nodeResults: Record<any, unknown>;
    endTime?: number | undefined;
    error?: string | undefined;
    metrics?: {
        totalExecutionTime?: number | undefined;
        nodeExecutionTimes?: Record<number, unknown> | undefined;
        successRate?: number | undefined;
    } | undefined;
};
/**
 * Checks if a workflow is valid
 * @param workflow The workflow to check
 * @returns True if the workflow is valid, false otherwise
 */
export declare function isWorkflowValid(workflow: any): boolean;
/**
 * Gets validation errors for a workflow
 * @param workflow The workflow to validate
 * @returns An array of validation errors or null if the workflow is valid
 */
export declare function getWorkflowValidationErrors(workflow: any): z.ZodError | null;
export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowExecution = z.infer<typeof workflowExecutionSchema>;
export type WorkflowNode = z.infer<typeof nodeSchema>;
export type WorkflowEdge = z.infer<typeof edgeSchema>;
export {};
