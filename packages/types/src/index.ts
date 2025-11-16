// Core types
export type {
  JsonValue,
  DataMap,
  UnknownRecord,
  Primitive,
  BaseEntity,
  ISODateTime,
  UUID,
  BaseConfig,
  BaseResponse,
  ValidationResult
} from './core/base-types';

// User types
export type {
  UserRole,
  UserPreferences
} from './user';

export {
  Permission
} from './user';

// Common types
export type {
  ApiResponse,
  Handler
} from './common-types';

// Agent types
export { // Export classes as values
  Agent,
  CreateAgentDto,
  UpdateAgentDto,
  AgentResponseDto,
  AgentStatus,
  AgentRole,
  AgentType,
  AgentCapability
} from './agent';
// Also export the AgentCapability type for TS consumers

// Messaging types
export type {
  AgentMessage,
  AgentResponse
} from './messaging';
export {
  PriorityQueue
} from './messaging';

// Workflow types
export type {
  WorkflowStep,
  WorkflowDefinition,
  WorkflowInstance,
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  StartWorkflowInstanceDto,
  WorkflowService,
  Workflow,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowExecutionStatus,
  WorkflowInput,
  WorkflowExecution
} from './workflow';

export {  WorkflowStatus  } from './workflow';

// Task types
export type {
  TaskStatusType,
  TaskPriorityType,
  TaskTypeValue,
  TaskMetadata,
  TaskDependency,
  CreateTaskDto,
  UpdateTaskDto,
  TaskService,
  TaskQuery,
  TaskResult,
  TaskFilter
} from './tasks';

// MCP types
export type {
  MCPMessage,
  MCPError,
  MCPTool,
  MCPResource,
  RegisteredEntity,
  CreateEntityDto,
  UpdateEntityDto
} from './mcp';

export {
  parseMCPMessage,
  createMCPResponse,
  createMCPError
 } from './mcp';

// WebSocket types
export type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketHandler
} from './websocket';

// Message and Communication types
export type {
  Message,
  MessageHandler,
  MessageBroker,
  MessageQueue,
  MessageRouter,
  MessageOptions
} from './message';
export { MessageType } from './message';

// Communication types
export type {
  Channel,
  ChannelOptions,
  CommunicationProtocol
} from './communication';
export { WebSocketError } from './communication';

// Command and Notification types
export type {
  Command,
  CommandResult,
  Notification,
  NotificationOptions,
  NotificationAction
} from './commands';

// Task types (additional exports)
export type { Task, TaskResult as CoreTaskResult } from './task';
export { TaskStatus, TaskType } from './task';

// Service types
export type { ServiceStatus } from './services';

// MASS Framework types
export type {
  MassOptimizationConfig,
  TopologyOptimizationConfig,
  ValidationInputItem,
  ValidationDataset,
  PerformanceMetrics,
  PromptDefinition,
  AgentPromptVersion,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTopology,
  OptimizationJob,
  MassBlockType,
  MassBlockConfig,
  AggregateConfig,
  ReflectConfig,
  DebateConfig,
  CustomConfig,
  ToolUseConfig,
  AgentWithMass,
  CreateOptimizedAgentDto,
  CreateTopologyDto,
  OptimizeTopologyDto
} from './mass';

// Other core exports
export * from './marketplace';
export * from './metrics';
export * from './security';
export type { SecurityScheme } from './security';
export * from './user';
export * from './state';
export * from './validation';
export * from './chat';
export * from './session';
export * from './suggestion';
export * from './export';
export * from './webhooks';

// Core enums
export { SuggestionStatus, SuggestionPriority } from './core/enums';
