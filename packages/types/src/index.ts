// Core types
export type {
  BaseConfig,
  BaseEntity,
  BaseResponse,
  DataMap,
  ISODateTime,
  JsonValue,
  Primitive,
  UUID,
  UnknownRecord,
  ValidationResult,
} from './core/base-types';

// User types
export type { UserPreferences, UserRole } from './user';

export { Permission } from './user';

// Common types
export type { ApiResponse, Handler } from './common-types';

// Agent types
export {
  Agent,
  AgentCapability,
  AgentResponseDto,
  AgentRole,
  AgentStatus,
  AgentType,
  CreateAgentDto,
  UpdateAgentDto,
} from './agent';
// Also export the AgentCapability type for TS consumers

// Messaging types
export { PriorityQueue } from './messaging';
export type { AgentMessage, AgentResponse } from './messaging';

// Workflow types
export type {
  CreateWorkflowDefinitionDto,
  CreateWorkflowDto,
  StartWorkflowInstanceDto,
  UpdateWorkflowDefinitionDto,
  UpdateWorkflowDto,
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowInput,
  WorkflowInstance,
  WorkflowService,
  WorkflowStep,
} from './workflow';

export { WorkflowStatus } from './workflow';

// Task types
export type {
  CreateTaskDto,
  TaskDependency,
  TaskFilter,
  TaskMetadata,
  TaskPriorityType,
  TaskQuery,
  TaskResult,
  TaskService,
  TaskStatusType,
  TaskTypeValue,
  UpdateTaskDto,
} from './tasks';

// MCP types
export type {
  CreateEntityDto,
  MCPError,
  MCPMessage,
  MCPResource,
  MCPTool,
  RegisteredEntity,
  UpdateEntityDto,
} from './mcp';

export { createMCPError, createMCPResponse, parseMCPMessage } from './mcp';

// WebSocket types
export type { WebSocketConfig, WebSocketHandler, WebSocketMessage } from './websocket';

// Message and Communication types
export { MessageType } from './message';
export type {
  Message,
  MessageBroker,
  MessageHandler,
  MessageOptions,
  MessageQueue,
  MessageRouter,
} from './message';

// Communication types
export { WebSocketError } from './communication';
export type { Channel, ChannelOptions, CommunicationProtocol } from './communication';

// Command and Notification types
export type {
  Command,
  CommandResult,
  Notification,
  NotificationAction,
  NotificationOptions,
} from './commands';

// Task types (additional exports)
export { TaskStatus, TaskType } from './task';
export type { TaskResult as CoreTaskResult, Task } from './task';

// Service types
export type { ServiceStatus } from './services';

// MASS Framework types
export type {
  AgentPromptVersion,
  AgentWithMass,
  AggregateConfig,
  CreateOptimizedAgentDto,
  CreateTopologyDto,
  CustomConfig,
  DebateConfig,
  MassBlockConfig,
  MassBlockType,
  MassOptimizationConfig,
  OptimizationJob,
  OptimizeTopologyDto,
  PerformanceMetrics,
  PromptDefinition,
  ReflectConfig,
  ToolUseConfig,
  TopologyOptimizationConfig,
  ValidationDataset,
  ValidationInputItem,
  WorkflowEdge,
  WorkflowNode,
  WorkflowTopology,
} from './mass';

// Other core exports
export * from './chat';
export * from './export';
export * from './llm';
export * from './marketplace';
export * from './metrics';
export * from './security';
export type { SecurityScheme } from './security';
export * from './session';
export * from './state';
export * from './suggestion';
export * from './user';
export * from './validation';
export * from './webhooks';

// Core enums
export { SuggestionPriority, SuggestionStatus } from './core/enums';

// Job types
export * from './jobs';
