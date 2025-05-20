
export {}
exports.workflowSchema = exports.updateWorkflowSchema = exports.createWorkflowSchema = exports.workflowExecutionResultSchema = exports.workflowExecutionContextSchema = exports.workflowConfigSchema = exports.workflowNodeSchema = exports.workflowEdgeSchema = exports.workflowStateSchema = exports.WorkflowStatus = void 0;
import zod_1 from 'zod';
import index_1 from './flow/index.js';
Object.defineProperty(exports, "WorkflowStatus", { enumerable: true, get: function (): any { return index_1.FlowStatus; } });
// Workflow state schema
exports.workflowStateSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(index_1.FlowStatus),
    error: zod_1.z.instanceof(Error).optional(),
    startTime: zod_1.z.date().optional(),
    endTime: zod_1.z.date().optional(),
    metrics: zod_1.z.object({
        nodeCount: zod_1.z.number(),
        edgeCount: zod_1.z.number(),
        runningNodes: zod_1.z.number(),
        completedNodes: zod_1.z.number(),
        failedNodes: zod_1.z.number(),
        customMetrics: zod_1.z.record(zod_1.z.unknown()).optional(),
    }).optional(),
    lastExecutedNode: zod_1.z.string().optional(),
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
