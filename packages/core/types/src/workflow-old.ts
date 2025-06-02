
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
});
    executionPath: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Workflow edge schema
exports.workflowEdgeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.string(),
    target: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.unknown()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Workflow node schema
exports.workflowNodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    data: zod_1.z.unknown(),
    config: zod_1.z.unknown().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Workflow config schema
exports.workflowConfigSchema = zod_1.z.object({
    maxRetries: zod_1.z.number().optional(),
    timeout: zod_1.z.number().optional(),
    concurrency: zod_1.z.number().optional(),
    autoStart: zod_1.z.boolean().optional(),
    validateBeforeRun: zod_1.z.boolean().optional(),
    stopOnError: zod_1.z.boolean().optional(),
    customConfig: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Workflow execution context schema
exports.workflowExecutionContextSchema = zod_1.z.object({
    workflowId: zod_1.z.string(),
    nodeId: zod_1.z.string().optional(),
    state: exports.workflowStateSchema,
    variables: zod_1.z.record(zod_1.z.unknown()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Workflow execution result schema
exports.workflowExecutionResultSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    error: zod_1.z.string().optional(),
    data: zod_1.z.unknown().optional(),
    nodeResults: zod_1.z.record(zod_1.z.unknown()).optional(),
    metrics: zod_1.z.object({
        duration: zod_1.z.number(),
        nodesExecuted: zod_1.z.number(),
        customMetrics: zod_1.z.record(zod_1.z.unknown()).optional(),
    }).optional(),
});
// Create workflow schema
exports.createWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    nodes: zod_1.z.array(exports.workflowNodeSchema),
    edges: zod_1.z.array(exports.workflowEdgeSchema),
    config: exports.workflowConfigSchema.optional(),
    version: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Update workflow schema
exports.updateWorkflowSchema = exports.createWorkflowSchema.partial();
// Full workflow schema
exports.workflowSchema = exports.createWorkflowSchema.extend({
    id: zod_1.z.string(),
    state: exports.workflowStateSchema,
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=workflow.js.mapexport {};
