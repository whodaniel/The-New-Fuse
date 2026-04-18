import { z } from 'zod';
import {
  WorkflowStatus,
  WorkflowExecutionStatus,
  AgentType,
  WorkflowNodeType,
  VariableType,
  VariableScope,
  TriggerType,
  NodeExecutionStatus,
  WorkflowEventType,
  WorkflowSortField,
  ExecutionSortField
} from '../types/WorkflowTypes.js';

// Enums
export const WorkflowStatusSchema = z.nativeEnum(WorkflowStatus);
export const WorkflowExecutionStatusSchema = z.nativeEnum(WorkflowExecutionStatus);
export const AgentTypeSchema = z.nativeEnum(AgentType);
export const WorkflowNodeTypeSchema = z.nativeEnum(WorkflowNodeType);
export const VariableTypeSchema = z.nativeEnum(VariableType);
export const VariableScopeSchema = z.nativeEnum(VariableScope);
export const TriggerTypeSchema = z.nativeEnum(TriggerType);
export const NodeExecutionStatusSchema = z.nativeEnum(NodeExecutionStatus);
export const WorkflowEventTypeSchema = z.nativeEnum(WorkflowEventType);
export const WorkflowSortFieldSchema = z.nativeEnum(WorkflowSortField);
export const ExecutionSortFieldSchema = z.nativeEnum(ExecutionSortField);

// Helper schemas
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const NodeConfigurationSchema = z.record(z.any());

export const VariableValidationSchema = z.object({
  pattern: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  required: z.boolean().optional(),
  enum: z.array(z.any()).optional(),
});

export const WorkflowVariableSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: VariableTypeSchema,
  defaultValue: z.any().optional(),
  description: z.string().optional(),
  required: z.boolean(),
  scope: VariableScopeSchema,
  validation: VariableValidationSchema.optional(),
});

export const NodeInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: VariableTypeSchema,
  required: z.boolean(),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
});

export const NodeOutputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: VariableTypeSchema,
  description: z.string().optional(),
  schema: z.any().optional(),
});

export const NodeConditionSchema = z.object({
  id: z.string().min(1),
  expression: z.string().min(1),
  outputId: z.string().min(1),
  description: z.string().optional(),
});

export const RetryPolicySchema = z.object({
  enabled: z.boolean(),
  maxAttempts: z.number().int().min(0),
  delayMs: z.number().int().min(0),
  backoffMultiplier: z.number().min(1),
  maxDelayMs: z.number().int().min(0),
});

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: WorkflowNodeTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  position: PositionSchema,
  config: NodeConfigurationSchema,
  inputs: z.array(NodeInputSchema),
  outputs: z.array(NodeOutputSchema),
  conditions: z.array(NodeConditionSchema).optional(),
  retry: RetryPolicySchema.optional(),
  timeout: z.number().int().min(0).optional(),
  metadata: z.record(z.any()),
});

export const WorkflowConnectionSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  sourceOutputId: z.string().min(1),
  targetNodeId: z.string().min(1),
  targetInputId: z.string().min(1),
  condition: z.string().optional(),
  metadata: z.record(z.any()),
});

export const TriggerConfigurationSchema = z.record(z.any());

export const CronScheduleSchema = z.object({
  expression: z.string().min(1),
  timezone: z.string().optional(),
  enabled: z.boolean(),
});

export const TriggerConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'regex']),
  value: z.any(),
});

export const WorkflowTriggerSchema = z.object({
  id: z.string().min(1),
  type: TriggerTypeSchema,
  name: z.string().min(1),
  enabled: z.boolean(),
  config: TriggerConfigurationSchema,
  schedule: CronScheduleSchema.optional(),
  conditions: z.array(TriggerConditionSchema).optional(),
});

export const NotificationChannelSchema = z.object({
  type: z.enum(['email', 'slack', 'webhook', 'relay']),
  config: z.record(z.any()),
});

export const NotificationSettingsSchema = z.object({
  onStart: z.boolean(),
  onComplete: z.boolean(),
  onError: z.boolean(),
  channels: z.array(NotificationChannelSchema),
});

export const ErrorHandlingPolicySchema = z.object({
  onError: z.enum(['stop', 'continue', 'retry', 'skip']),
  captureErrors: z.boolean(),
  notifyOnError: z.boolean(),
  fallbackWorkflowId: z.string().optional(),
});

export const LoggingSettingsSchema = z.object({
  level: z.enum(['none', 'error', 'warn', 'info', 'debug']),
  includeInputs: z.boolean(),
  includeOutputs: z.boolean(),
  includeTiming: z.boolean(),
  retentionDays: z.number().int().min(0),
});

export const WorkflowSettingsSchema = z.object({
  parallel: z.boolean(),
  maxConcurrentExecutions: z.number().int().min(1),
  timeoutMs: z.number().int().min(0),
  retryPolicy: RetryPolicySchema,
  errorHandling: ErrorHandlingPolicySchema,
  logging: LoggingSettingsSchema,
  notifications: NotificationSettingsSchema,
});

export const WorkflowDefinitionSchema = z.object({
  version: z.string().min(1),
  nodes: z.array(WorkflowNodeSchema),
  connections: z.array(WorkflowConnectionSchema),
  variables: z.array(WorkflowVariableSchema),
  triggers: z.array(WorkflowTriggerSchema),
  settings: WorkflowSettingsSchema,
});

export const PerformanceMetricsSchema = z.object({
  averageCpuUsage: z.number(),
  averageMemoryUsage: z.number(),
  peakMemoryUsage: z.number(),
  throughput: z.number(),
  bottleneckNodes: z.array(z.string()),
});

export const WorkflowStatisticsSchema = z.object({
  totalExecutions: z.number().int().min(0),
  successfulExecutions: z.number().int().min(0),
  failedExecutions: z.number().int().min(0),
  averageExecutionTime: z.number(),
  successRate: z.number().min(0).max(1),
  lastExecutionStatus: WorkflowExecutionStatusSchema.optional(),
  lastExecutionError: z.string().optional(),
  performance: PerformanceMetricsSchema,
});

export const WorkflowDependencySchema = z.object({
  type: z.enum(['workflow', 'agent', 'service', 'package']),
  id: z.string().min(1),
  version: z.string().optional(),
  required: z.boolean(),
});

export const ChangelogEntrySchema = z.object({
  version: z.string().min(1),
  date: z.date().or(z.string().transform((str) => new Date(str))),
  changes: z.array(z.string()),
  author: z.string().min(1),
});

export const WorkflowMetadataSchema = z.object({
  category: z.string().min(1),
  tags: z.array(z.string()),
  author: z.string().min(1),
  authorEmail: z.string().email().optional(),
  description: z.string().optional(),
  documentation: z.string().optional(),
  changelog: z.array(ChangelogEntrySchema).optional(),
  dependencies: z.array(WorkflowDependencySchema),
  integrations: z.array(z.string()),
  customProperties: z.record(z.any()),
});

export const UnifiedWorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  definition: WorkflowDefinitionSchema,
  status: WorkflowStatusSchema,
  agentId: z.string().optional(),
  userId: z.string().optional(),
  version: z.string().min(1),
  tags: z.array(z.string()),
  isTemplate: z.boolean(),
  createdAt: z.date().or(z.string().transform((str) => new Date(str))),
  updatedAt: z.date().or(z.string().transform((str) => new Date(str))),
  lastExecutedAt: z.date().or(z.string().transform((str) => new Date(str))).optional(),
  executionCount: z.number().int().min(0),
  statistics: WorkflowStatisticsSchema,
  metadata: WorkflowMetadataSchema,
});

// Specific Node Config Schemas
export const AgentTaskNodeConfigSchema = z.object({
  agentId: z.string().optional(),
  agentType: AgentTypeSchema.optional(),
  task: z.string().min(1),
  instructions: z.string().optional(),
  context: z.record(z.any()).optional(),
  handoffTemplateId: z.string().optional(),
  expectedDuration: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high']),
}).passthrough();

export const AgentHandoffNodeConfigSchema = z.object({
  fromAgentId: z.string().min(1),
  toAgentId: z.string().min(1),
  handoffTemplateId: z.string().min(1),
  preserveContext: z.boolean(),
  stagnationThresholdMs: z.number().int().min(0),
  fallbackAgentId: z.string().optional(),
}).passthrough();

export const ConditionNodeConfigSchema = z.object({
  expression: z.string().min(1),
  truthyOutput: z.any(),
  falsyOutput: z.any(),
}).passthrough();

export const LoopNodeConfigSchema = z.object({
  iterableVariable: z.string().min(1),
  itemVariable: z.string().min(1),
  maxIterations: z.number().int().min(1).optional(),
  breakCondition: z.string().optional(),
}).passthrough();

export const APICallNodeConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: z.record(z.string()),
  body: z.any().optional(),
  responseMapping: z.record(z.string()).optional(),
  timeout: z.number().int().min(0).optional(),
}).passthrough();

export const LLMPromptNodeConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'local']),
  model: z.string().min(1),
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(1).optional(),
  stopSequences: z.array(z.string()).optional(),
  responseFormat: z.enum(['text', 'json', 'structured']).optional(),
}).passthrough();
