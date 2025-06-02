import { z } from 'zod';
import { FlowStatus } from './flow/index.js';

// Re-export FlowStatus as WorkflowStatus for compatibility
export const WorkflowStatus = FlowStatus;

// Workflow state schema
export const workflowStateSchema = z.object({
    status: z.nativeEnum(FlowStatus),
    error: z.instanceof(Error).optional(),
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    metrics: z.object({
        nodeCount: z.number(),
        edgeCount: z.number(),
        runningNodes: z.number(),
        completedNodes: z.number(),
        failedNodes: z.number(),
        customMetrics: z.record(z.unknown()).optional(),
    }).optional(),
    lastExecutedNode: z.string().optional(),
    executionPath: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
});

// Workflow edge schema
export const workflowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
});

// Workflow node schema
export const workflowNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    data: z.unknown(),
    config: z.unknown().optional(),
    metadata: z.record(z.unknown()).optional(),
});

// Workflow config schema
export const workflowConfigSchema = z.object({
    maxRetries: z.number().optional(),
    timeout: z.number().optional(),
    concurrency: z.number().optional(),
    autoStart: z.boolean().optional(),
    validateBeforeRun: z.boolean().optional(),
    stopOnError: z.boolean().optional(),
    customConfig: z.record(z.unknown()).optional(),
});

// Workflow execution context schema
export const workflowExecutionContextSchema = z.object({
    workflowId: z.string(),
    nodeId: z.string().optional(),
    state: workflowStateSchema,
    variables: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
});

// Workflow execution result schema
export const workflowExecutionResultSchema = z.object({
    success: z.boolean(),
    error: z.string().optional(),
    data: z.unknown().optional(),
    nodeResults: z.record(z.unknown()).optional(),
    metrics: z.object({
        duration: z.number(),
        nodesExecuted: z.number(),
        customMetrics: z.record(z.unknown()).optional(),
    }).optional(),
});

// Create workflow schema
export const createWorkflowSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    nodes: z.array(workflowNodeSchema),
    edges: z.array(workflowEdgeSchema),
    config: workflowConfigSchema.optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
});

// Update workflow schema
export const updateWorkflowSchema = createWorkflowSchema.partial();

// Full workflow schema
export const workflowSchema = createWorkflowSchema.extend({
    id: z.string(),
    state: workflowStateSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Type exports
export type WorkflowState = z.infer<typeof workflowStateSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowConfig = z.infer<typeof workflowConfigSchema>;
export type WorkflowExecutionContext = z.infer<typeof workflowExecutionContextSchema>;
export type WorkflowExecutionResult = z.infer<typeof workflowExecutionResultSchema>;
export type CreateWorkflow = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof updateWorkflowSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
