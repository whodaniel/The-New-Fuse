"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMPromptNodeConfigSchema = exports.APICallNodeConfigSchema = exports.LoopNodeConfigSchema = exports.ConditionNodeConfigSchema = exports.AgentHandoffNodeConfigSchema = exports.AgentTaskNodeConfigSchema = exports.UnifiedWorkflowSchema = exports.WorkflowMetadataSchema = exports.ChangelogEntrySchema = exports.WorkflowDependencySchema = exports.WorkflowStatisticsSchema = exports.PerformanceMetricsSchema = exports.WorkflowDefinitionSchema = exports.WorkflowSettingsSchema = exports.LoggingSettingsSchema = exports.ErrorHandlingPolicySchema = exports.NotificationSettingsSchema = exports.NotificationChannelSchema = exports.WorkflowTriggerSchema = exports.TriggerConditionSchema = exports.CronScheduleSchema = exports.TriggerConfigurationSchema = exports.WorkflowConnectionSchema = exports.WorkflowNodeSchema = exports.RetryPolicySchema = exports.NodeConditionSchema = exports.NodeOutputSchema = exports.NodeInputSchema = exports.WorkflowVariableSchema = exports.VariableValidationSchema = exports.NodeConfigurationSchema = exports.PositionSchema = exports.ExecutionSortFieldSchema = exports.WorkflowSortFieldSchema = exports.WorkflowEventTypeSchema = exports.NodeExecutionStatusSchema = exports.TriggerTypeSchema = exports.VariableScopeSchema = exports.VariableTypeSchema = exports.WorkflowNodeTypeSchema = exports.AgentTypeSchema = exports.WorkflowExecutionStatusSchema = exports.WorkflowStatusSchema = void 0;
const zod_1 = require("zod");
const WorkflowTypes_js_1 = require("../types/WorkflowTypes.js");
// Enums
exports.WorkflowStatusSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.WorkflowStatus);
exports.WorkflowExecutionStatusSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.WorkflowExecutionStatus);
exports.AgentTypeSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.AgentType);
exports.WorkflowNodeTypeSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.WorkflowNodeType);
exports.VariableTypeSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.VariableType);
exports.VariableScopeSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.VariableScope);
exports.TriggerTypeSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.TriggerType);
exports.NodeExecutionStatusSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.NodeExecutionStatus);
exports.WorkflowEventTypeSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.WorkflowEventType);
exports.WorkflowSortFieldSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.WorkflowSortField);
exports.ExecutionSortFieldSchema = zod_1.z.nativeEnum(WorkflowTypes_js_1.ExecutionSortField);
// Helper schemas
exports.PositionSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
});
exports.NodeConfigurationSchema = zod_1.z.record(zod_1.z.any());
exports.VariableValidationSchema = zod_1.z.object({
    pattern: zod_1.z.string().optional(),
    minLength: zod_1.z.number().optional(),
    maxLength: zod_1.z.number().optional(),
    min: zod_1.z.number().optional(),
    max: zod_1.z.number().optional(),
    required: zod_1.z.boolean().optional(),
    enum: zod_1.z.array(zod_1.z.any()).optional(),
});
exports.WorkflowVariableSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: exports.VariableTypeSchema,
    defaultValue: zod_1.z.any().optional(),
    description: zod_1.z.string().optional(),
    required: zod_1.z.boolean(),
    scope: exports.VariableScopeSchema,
    validation: exports.VariableValidationSchema.optional(),
});
exports.NodeInputSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: exports.VariableTypeSchema,
    required: zod_1.z.boolean(),
    description: zod_1.z.string().optional(),
    defaultValue: zod_1.z.any().optional(),
});
exports.NodeOutputSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: exports.VariableTypeSchema,
    description: zod_1.z.string().optional(),
    schema: zod_1.z.any().optional(),
});
exports.NodeConditionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    expression: zod_1.z.string().min(1),
    outputId: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
exports.RetryPolicySchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    maxAttempts: zod_1.z.number().int().min(0),
    delayMs: zod_1.z.number().int().min(0),
    backoffMultiplier: zod_1.z.number().min(1),
    maxDelayMs: zod_1.z.number().int().min(0),
});
exports.WorkflowNodeSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: exports.WorkflowNodeTypeSchema,
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    position: exports.PositionSchema,
    config: exports.NodeConfigurationSchema,
    inputs: zod_1.z.array(exports.NodeInputSchema),
    outputs: zod_1.z.array(exports.NodeOutputSchema),
    conditions: zod_1.z.array(exports.NodeConditionSchema).optional(),
    retry: exports.RetryPolicySchema.optional(),
    timeout: zod_1.z.number().int().min(0).optional(),
    metadata: zod_1.z.record(zod_1.z.any()),
});
exports.WorkflowConnectionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    sourceNodeId: zod_1.z.string().min(1),
    sourceOutputId: zod_1.z.string().min(1),
    targetNodeId: zod_1.z.string().min(1),
    targetInputId: zod_1.z.string().min(1),
    condition: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()),
});
exports.TriggerConfigurationSchema = zod_1.z.record(zod_1.z.any());
exports.CronScheduleSchema = zod_1.z.object({
    expression: zod_1.z.string().min(1),
    timezone: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean(),
});
exports.TriggerConditionSchema = zod_1.z.object({
    field: zod_1.z.string().min(1),
    operator: zod_1.z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'regex']),
    value: zod_1.z.any(),
});
exports.WorkflowTriggerSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: exports.TriggerTypeSchema,
    name: zod_1.z.string().min(1),
    enabled: zod_1.z.boolean(),
    config: exports.TriggerConfigurationSchema,
    schedule: exports.CronScheduleSchema.optional(),
    conditions: zod_1.z.array(exports.TriggerConditionSchema).optional(),
});
exports.NotificationChannelSchema = zod_1.z.object({
    type: zod_1.z.enum(['email', 'slack', 'webhook', 'relay']),
    config: zod_1.z.record(zod_1.z.any()),
});
exports.NotificationSettingsSchema = zod_1.z.object({
    onStart: zod_1.z.boolean(),
    onComplete: zod_1.z.boolean(),
    onError: zod_1.z.boolean(),
    channels: zod_1.z.array(exports.NotificationChannelSchema),
});
exports.ErrorHandlingPolicySchema = zod_1.z.object({
    onError: zod_1.z.enum(['stop', 'continue', 'retry', 'skip']),
    captureErrors: zod_1.z.boolean(),
    notifyOnError: zod_1.z.boolean(),
    fallbackWorkflowId: zod_1.z.string().optional(),
});
exports.LoggingSettingsSchema = zod_1.z.object({
    level: zod_1.z.enum(['none', 'error', 'warn', 'info', 'debug']),
    includeInputs: zod_1.z.boolean(),
    includeOutputs: zod_1.z.boolean(),
    includeTiming: zod_1.z.boolean(),
    retentionDays: zod_1.z.number().int().min(0),
});
exports.WorkflowSettingsSchema = zod_1.z.object({
    parallel: zod_1.z.boolean(),
    maxConcurrentExecutions: zod_1.z.number().int().min(1),
    timeoutMs: zod_1.z.number().int().min(0),
    retryPolicy: exports.RetryPolicySchema,
    errorHandling: exports.ErrorHandlingPolicySchema,
    logging: exports.LoggingSettingsSchema,
    notifications: exports.NotificationSettingsSchema,
});
exports.WorkflowDefinitionSchema = zod_1.z.object({
    version: zod_1.z.string().min(1),
    nodes: zod_1.z.array(exports.WorkflowNodeSchema),
    connections: zod_1.z.array(exports.WorkflowConnectionSchema),
    variables: zod_1.z.array(exports.WorkflowVariableSchema),
    triggers: zod_1.z.array(exports.WorkflowTriggerSchema),
    settings: exports.WorkflowSettingsSchema,
});
exports.PerformanceMetricsSchema = zod_1.z.object({
    averageCpuUsage: zod_1.z.number(),
    averageMemoryUsage: zod_1.z.number(),
    peakMemoryUsage: zod_1.z.number(),
    throughput: zod_1.z.number(),
    bottleneckNodes: zod_1.z.array(zod_1.z.string()),
});
exports.WorkflowStatisticsSchema = zod_1.z.object({
    totalExecutions: zod_1.z.number().int().min(0),
    successfulExecutions: zod_1.z.number().int().min(0),
    failedExecutions: zod_1.z.number().int().min(0),
    averageExecutionTime: zod_1.z.number(),
    successRate: zod_1.z.number().min(0).max(1),
    lastExecutionStatus: exports.WorkflowExecutionStatusSchema.optional(),
    lastExecutionError: zod_1.z.string().optional(),
    performance: exports.PerformanceMetricsSchema,
});
exports.WorkflowDependencySchema = zod_1.z.object({
    type: zod_1.z.enum(['workflow', 'agent', 'service', 'package']),
    id: zod_1.z.string().min(1),
    version: zod_1.z.string().optional(),
    required: zod_1.z.boolean(),
});
exports.ChangelogEntrySchema = zod_1.z.object({
    version: zod_1.z.string().min(1),
    date: zod_1.z.date().or(zod_1.z.string().transform((str) => new Date(str))),
    changes: zod_1.z.array(zod_1.z.string()),
    author: zod_1.z.string().min(1),
});
exports.WorkflowMetadataSchema = zod_1.z.object({
    category: zod_1.z.string().min(1),
    tags: zod_1.z.array(zod_1.z.string()),
    author: zod_1.z.string().min(1),
    authorEmail: zod_1.z.string().email().optional(),
    description: zod_1.z.string().optional(),
    documentation: zod_1.z.string().optional(),
    changelog: zod_1.z.array(exports.ChangelogEntrySchema).optional(),
    dependencies: zod_1.z.array(exports.WorkflowDependencySchema),
    integrations: zod_1.z.array(zod_1.z.string()),
    customProperties: zod_1.z.record(zod_1.z.any()),
});
exports.UnifiedWorkflowSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    definition: exports.WorkflowDefinitionSchema,
    status: exports.WorkflowStatusSchema,
    agentId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    version: zod_1.z.string().min(1),
    tags: zod_1.z.array(zod_1.z.string()),
    isTemplate: zod_1.z.boolean(),
    createdAt: zod_1.z.date().or(zod_1.z.string().transform((str) => new Date(str))),
    updatedAt: zod_1.z.date().or(zod_1.z.string().transform((str) => new Date(str))),
    lastExecutedAt: zod_1.z.date().or(zod_1.z.string().transform((str) => new Date(str))).optional(),
    executionCount: zod_1.z.number().int().min(0),
    statistics: exports.WorkflowStatisticsSchema,
    metadata: exports.WorkflowMetadataSchema,
});
// Specific Node Config Schemas
exports.AgentTaskNodeConfigSchema = zod_1.z.object({
    agentId: zod_1.z.string().optional(),
    agentType: exports.AgentTypeSchema.optional(),
    task: zod_1.z.string().min(1),
    instructions: zod_1.z.string().optional(),
    context: zod_1.z.record(zod_1.z.any()).optional(),
    handoffTemplateId: zod_1.z.string().optional(),
    expectedDuration: zod_1.z.number().optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']),
}).passthrough();
exports.AgentHandoffNodeConfigSchema = zod_1.z.object({
    fromAgentId: zod_1.z.string().min(1),
    toAgentId: zod_1.z.string().min(1),
    handoffTemplateId: zod_1.z.string().min(1),
    preserveContext: zod_1.z.boolean(),
    stagnationThresholdMs: zod_1.z.number().int().min(0),
    fallbackAgentId: zod_1.z.string().optional(),
}).passthrough();
exports.ConditionNodeConfigSchema = zod_1.z.object({
    expression: zod_1.z.string().min(1),
    truthyOutput: zod_1.z.any(),
    falsyOutput: zod_1.z.any(),
}).passthrough();
exports.LoopNodeConfigSchema = zod_1.z.object({
    iterableVariable: zod_1.z.string().min(1),
    itemVariable: zod_1.z.string().min(1),
    maxIterations: zod_1.z.number().int().min(1).optional(),
    breakCondition: zod_1.z.string().optional(),
}).passthrough();
exports.APICallNodeConfigSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    method: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    headers: zod_1.z.record(zod_1.z.string()),
    body: zod_1.z.any().optional(),
    responseMapping: zod_1.z.record(zod_1.z.string()).optional(),
    timeout: zod_1.z.number().int().min(0).optional(),
}).passthrough();
exports.LLMPromptNodeConfigSchema = zod_1.z.object({
    provider: zod_1.z.enum(['openai', 'anthropic', 'google', 'local']),
    model: zod_1.z.string().min(1),
    prompt: zod_1.z.string().min(1),
    systemPrompt: zod_1.z.string().optional(),
    temperature: zod_1.z.number().min(0).max(1).optional(),
    maxTokens: zod_1.z.number().int().min(1).optional(),
    stopSequences: zod_1.z.array(zod_1.z.string()).optional(),
    responseFormat: zod_1.z.enum(['text', 'json', 'structured']).optional(),
}).passthrough();
//# sourceMappingURL=WorkflowSchemas.js.map