/**
 * Unified Workflow Types for The New Fuse Framework
 *
 * Consolidates all workflow-related types from scattered locations into a single source of truth.
 * Integrates with existing Prisma schema and provides enhanced type safety.
 */

// Define enums locally since they may not exist in @prisma/client
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  PAUSED = 'PAUSED',
}

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

export enum AgentType {
  DEVELOPER = 'DEVELOPER',
  RESEARCHER = 'RESEARCHER',
  ANALYST = 'ANALYST',
  COORDINATOR = 'COORDINATOR',
  CUSTOM = 'CUSTOM',
}

// Core workflow interfaces
export interface UnifiedWorkflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  agentId?: string;
  userId?: string;
  version: string;
  tags: string[];
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  statistics: WorkflowStatistics;
  metadata: WorkflowMetadata;
}

export interface WorkflowDefinition {
  version: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
  settings: WorkflowSettings;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  config: NodeConfiguration;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  conditions?: NodeCondition[];
  retry?: RetryPolicy;
  timeout?: number; // milliseconds
  metadata: Record<string, any>;
}

export enum WorkflowNodeType {
  // Basic nodes
  START = 'start',
  END = 'end',

  // Agent nodes
  AGENT_TASK = 'agent_task',
  AGENT_HANDOFF = 'agent_handoff',
  AGENT_COORDINATION = 'agent_coordination',

  // Logic nodes
  CONDITION = 'condition',
  LOOP = 'loop',
  PARALLEL = 'parallel',
  MERGE = 'merge',

  // Integration nodes
  API_CALL = 'api_call',
  DATABASE_QUERY = 'database_query',
  FILE_OPERATION = 'file_operation',

  // Communication nodes
  RELAY_MESSAGE = 'relay_message',
  WEBHOOK = 'webhook',
  EMAIL = 'email',

  // AI/LLM nodes
  LLM_PROMPT = 'llm_prompt',
  CODE_GENERATION = 'code_generation',
  ANALYSIS = 'analysis',

  // Sandbox nodes
  SANDBOX_EXECUTION = 'sandbox_execution',

  // Custom nodes
  CUSTOM = 'custom',
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
  condition?: string; // JavaScript expression
  metadata: Record<string, any>;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: VariableType;
  defaultValue?: any;
  description?: string;
  required: boolean;
  scope: VariableScope;
  validation?: VariableValidation;
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  DATE = 'date',
  FILE = 'file',
  SECRET = 'secret',
}

export enum VariableScope {
  GLOBAL = 'global',
  WORKFLOW = 'workflow',
  NODE = 'node',
  EXECUTION = 'execution',
}

export interface VariableValidation {
  pattern?: string; // regex pattern
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  enum?: any[];
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  name: string;
  enabled: boolean;
  config: TriggerConfiguration;
  schedule?: CronSchedule;
  conditions?: TriggerCondition[];
}

export enum TriggerType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  FILE_CHANGE = 'file_change',
  AGENT_EVENT = 'agent_event',
  RELAY_MESSAGE = 'relay_message',
  DATABASE_CHANGE = 'database_change',
  API_ENDPOINT = 'api_endpoint',
}

export interface TriggerConfiguration {
  [key: string]: any;
}

export interface CronSchedule {
  expression: string; // cron expression
  timezone?: string;
  enabled: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
  value: any;
}

export interface WorkflowSettings {
  parallel: boolean;
  maxConcurrentExecutions: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  errorHandling: ErrorHandlingPolicy;
  logging: LoggingSettings;
  notifications: NotificationSettings;
}

export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export interface ErrorHandlingPolicy {
  onError: 'stop' | 'continue' | 'retry' | 'skip';
  captureErrors: boolean;
  notifyOnError: boolean;
  fallbackWorkflowId?: string;
}

export interface LoggingSettings {
  level: 'none' | 'error' | 'warn' | 'info' | 'debug';
  includeInputs: boolean;
  includeOutputs: boolean;
  includeTiming: boolean;
  retentionDays: number;
}

export interface NotificationSettings {
  onStart: boolean;
  onComplete: boolean;
  onError: boolean;
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'relay';
  config: Record<string, any>;
}

// Node-specific configurations
export interface NodeConfiguration {
  [key: string]: any;
}

export interface AgentTaskNodeConfig extends NodeConfiguration {
  agentId?: string;
  agentType?: AgentType;
  task: string;
  instructions?: string;
  context?: Record<string, any>;
  handoffTemplateId?: string;
  expectedDuration?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface AgentHandoffNodeConfig extends NodeConfiguration {
  fromAgentId: string;
  toAgentId: string;
  handoffTemplateId: string;
  preserveContext: boolean;
  stagnationThresholdMs: number;
  fallbackAgentId?: string;
}

export interface ConditionNodeConfig extends NodeConfiguration {
  expression: string; // JavaScript expression
  truthyOutput: string;
  falsyOutput: string;
}

export interface LoopNodeConfig extends NodeConfiguration {
  iterableVariable: string;
  itemVariable: string;
  maxIterations?: number;
  breakCondition?: string;
}

export interface APICallNodeConfig extends NodeConfiguration {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: any;
  responseMapping?: Record<string, string>;
  timeout?: number;
}

export interface LLMPromptNodeConfig extends NodeConfiguration {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json' | 'structured';
}

export interface SandboxExecutionNodeConfig extends NodeConfiguration {
  language: 'javascript' | 'python' | 'bash' | 'typescript';
  code: string;
  environmentVariables?: Record<string, string>;
  timeoutMs?: number;
  resourceLimits?: {
    cpu?: number;
    memory?: number;
  };
}

// Input/Output interfaces
export interface NodeInput {
  id: string;
  name: string;
  type: VariableType;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface NodeOutput {
  id: string;
  name: string;
  type: VariableType;
  description?: string;
  schema?: any; // JSON schema for validation
}

export interface NodeCondition {
  id: string;
  expression: string;
  outputId: string;
  description?: string;
}

// Execution interfaces
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  triggeredBy: string; // user ID or system
  triggerType: TriggerType;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: ExecutionError;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  nodeExecutions: NodeExecution[];
  context: ExecutionContext;
  statistics: ExecutionStatistics;
  logs: ExecutionLog[];
  metadata: Record<string, any>;
}

export interface NodeExecution {
  id: string;
  nodeId: string;
  status: NodeExecutionStatus;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: ExecutionError;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  retryCount: number;
  agentId?: string; // If executed by an agent
  metadata: Record<string, any>;
}

export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export interface ExecutionError {
  code: string;
  message: string;
  stack?: string;
  nodeId?: string;
  timestamp: Date;
  recoverable: boolean;
  metadata: Record<string, any>;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, any>;
  agentRegistry?: Record<string, any>;
  relayConnection?: any;
  userContext?: Record<string, any>;
  temporaryData: Record<string, any>;
}

export interface ExecutionStatistics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  skippedNodes: number;
  totalDuration: number;
  averageNodeDuration: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
  agentId?: string;
  metadata: Record<string, any>;
}

// Statistics and metadata
export interface WorkflowStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecutionStatus?: WorkflowExecutionStatus;
  lastExecutionError?: string;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageCpuUsage: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  throughput: number; // executions per hour
  bottleneckNodes: string[]; // node IDs that take longest
}

export interface WorkflowMetadata {
  category: string;
  tags: string[];
  author: string;
  authorEmail?: string;
  description?: string;
  documentation?: string;
  changelog?: ChangelogEntry[];
  dependencies: WorkflowDependency[];
  integrations: string[]; // List of integrated services
  customProperties: Record<string, any>;
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: string[];
  author: string;
}

export interface WorkflowDependency {
  type: 'workflow' | 'agent' | 'service' | 'package';
  id: string;
  version?: string;
  required: boolean;
}

// Builder and validation interfaces
export interface WorkflowValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  connectionId?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  nodeId?: string;
  suggestion?: string;
}

// Import/Export interfaces
export interface WorkflowTemplate {
  metadata: WorkflowTemplateMetadata;
  definition: WorkflowDefinition;
  documentation?: string;
  examples?: WorkflowExample[];
}

export interface WorkflowTemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  version: string;
  compatibility: string[]; // Compatible TNF versions
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes to set up
}

export interface WorkflowExample {
  name: string;
  description: string;
  input: Record<string, any>;
  expectedOutput: Record<string, any>;
  notes?: string;
}

// Events and hooks
export interface WorkflowEvent {
  id: string;
  type: WorkflowEventType;
  workflowId: string;
  executionId?: string;
  nodeId?: string;
  agentId?: string;
  timestamp: Date;
  data: Record<string, any>;
}

export enum WorkflowEventType {
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  WORKFLOW_CANCELLED = 'workflow_cancelled',
  NODE_STARTED = 'node_started',
  NODE_COMPLETED = 'node_completed',
  NODE_FAILED = 'node_failed',
  AGENT_ASSIGNED = 'agent_assigned',
  AGENT_HANDOFF = 'agent_handoff',
  VARIABLE_UPDATED = 'variable_updated',
  ERROR_OCCURRED = 'error_occurred',
}

export interface WorkflowHook {
  id: string;
  name: string;
  event: WorkflowEventType;
  condition?: string; // JavaScript expression
  action: HookAction;
  enabled: boolean;
  priority: number;
}

export interface HookAction {
  type: 'webhook' | 'function' | 'workflow' | 'notification';
  config: Record<string, any>;
}

// Query and filter interfaces
export interface WorkflowQuery {
  search?: string;
  status?: WorkflowStatus[];
  agentId?: string;
  userId?: string;
  tags?: string[];
  category?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastExecutedAfter?: Date;
  lastExecutedBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: WorkflowSortField;
  sortOrder?: 'asc' | 'desc';
}

export enum WorkflowSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_EXECUTED_AT = 'lastExecutedAt',
  EXECUTION_COUNT = 'executionCount',
  SUCCESS_RATE = 'successRate',
}

export interface ExecutionQuery {
  workflowId?: string;
  status?: WorkflowExecutionStatus[];
  triggeredBy?: string;
  triggerType?: TriggerType;
  startedAfter?: Date;
  startedBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
  hasErrors?: boolean;
  duration?: { min?: number; max?: number };
  limit?: number;
  offset?: number;
  sortBy?: ExecutionSortField;
  sortOrder?: 'asc' | 'desc';
}

export enum ExecutionSortField {
  STARTED_AT = 'startedAt',
  COMPLETED_AT = 'completedAt',
  DURATION = 'duration',
  STATUS = 'status',
}

// Integration with The New Fuse systems
export interface RelayIntegration {
  enabled: boolean;
  relayServerId?: string;
  messageRouting: boolean;
  agentCoordination: boolean;
  heartbeatMonitoring: boolean;
}

export interface AgentRegistryIntegration {
  enabled: boolean;
  masterRegistryId?: string;
  autoRegisterAgents: boolean;
  onboardingWorkflowId?: string;
  complianceChecking: boolean;
}

export interface StatePreservationIntegration {
  enabled: boolean;
  redisConnection?: any;
  persistenceLevel: 'none' | 'variables' | 'full_context';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

// Helper type utilities
export type WorkflowNodeConfigMap = {
  [WorkflowNodeType.AGENT_TASK]: AgentTaskNodeConfig;
  [WorkflowNodeType.AGENT_HANDOFF]: AgentHandoffNodeConfig;
  [WorkflowNodeType.CONDITION]: ConditionNodeConfig;
  [WorkflowNodeType.LOOP]: LoopNodeConfig;
  [WorkflowNodeType.API_CALL]: APICallNodeConfig;
  [WorkflowNodeType.LLM_PROMPT]: LLMPromptNodeConfig;
  // Add more as needed
};

export type NodeConfigForType<T extends WorkflowNodeType> = T extends keyof WorkflowNodeConfigMap
  ? WorkflowNodeConfigMap[T]
  : NodeConfiguration;

// Export utility functions for type checking
export function isAgentTaskNode(
  node: WorkflowNode
): node is WorkflowNode & { config: AgentTaskNodeConfig } {
  return node.type === WorkflowNodeType.AGENT_TASK;
}

export function isAgentHandoffNode(
  node: WorkflowNode
): node is WorkflowNode & { config: AgentHandoffNodeConfig } {
  return node.type === WorkflowNodeType.AGENT_HANDOFF;
}

export function isConditionNode(
  node: WorkflowNode
): node is WorkflowNode & { config: ConditionNodeConfig } {
  return node.type === WorkflowNodeType.CONDITION;
}

export function isLLMPromptNode(
  node: WorkflowNode
): node is WorkflowNode & { config: LLMPromptNodeConfig } {
  return node.type === WorkflowNodeType.LLM_PROMPT;
}
