/**
 * Core MCP Protocol Interfaces
 *
 * This module defines the fundamental interfaces for the Model Context Protocol (MCP)
 * implementation, including server, client, and broker interfaces.
 */

export { AgentStatus } from './IMCPAgentIntegration.js';
export type {
  Agent,
  AgentCapabilityDiscovery,
  AgentCollaboration,
  AgentMCPEndpoint,
  AgentMessageResult,
  AgentMessageRouting,
  AgentRegistrationResult,
  IMCPAgentIntegration,
} from './IMCPAgentIntegration.js';
export type { IMCPBroker } from './IMCPBroker.js';
export type {
  CapabilityDependency,
  CapabilityMetadata,
  CapabilityMetrics,
  CapabilityRegistry,
  CapabilityStatus,
  MCPCapability,
} from './IMCPCapability.js';
export type { IMCPClient } from './IMCPClient.js';
export type {
  AuthConfig,
  ConnectionMetrics,
  ConnectionOptions,
  ConnectionStatus,
  IConnectionManager,
  MCPConnection,
  TLSConfig,
} from './IMCPConnection.js';
export type {
  JSONRPCError,
  JSONRPCMessage,
  JSONRPCMessage_Union,
  JSONRPCNotification,
  JSONRPCRequest,
  JSONRPCResponse,
  MCPError,
  MCPMessage,
  MCPNotification,
  MCPRequest,
  MCPResponse,
} from './IMCPMessage.js';
export type {
  MCPResource,
  ResourceCaching,
  ResourceCallback,
  ResourceContent,
  ResourceHandler,
  ResourcePermissions,
} from './IMCPResource.js';
export type { IMCPServer } from './IMCPServer.js';
export type {
  AutoDiscoveryConfig,
  CircuitBreakerConfig,
  IMCPServiceMesh,
  ScalingEvent,
  ScalingPolicy,
  ServiceEndpoint,
  ServiceMeshHealthCheck,
  ServiceMeshIntegrationResult,
  ServiceMeshIntegrationStatus,
  ServiceMeshLoadBalancing,
  ServiceMeshMetrics,
  ServiceMeshQuery,
  ServiceMeshRegistration,
  ServiceScalingConfig,
} from './IMCPServiceMesh.js';
export type {
  JSONSchema,
  MCPTool,
  RateLimitConfig,
  ResourceLimits,
  ToolConfig,
  ToolExecutionMetadata,
  ToolHandler,
  ToolPermissions,
  ToolResult,
  ToolUsageStats,
  ValidationResult,
} from './IMCPTool.js';
export type {
  AuthContext,
  ErrorRecoveryConfig,
  ExecutionStatus,
  IMCPWorkflowIntegration,
  MCPCallback,
  MonitoringConfig,
  StepResult,
  Task,
  TaskExecutionStatus,
  TaskResult,
  WorkflowContext,
  WorkflowStep,
} from './IMCPWorkflowIntegration.js';
export type { EventCallback, IMessageRouter } from './IMessageRouter.js';
export type {
  AlertRule,
  HealthCheck,
  HealthCheckResult,
  IAlertManager,
  ICacheMonitor,
  IConnectionPoolMonitor,
  IDashboardManager,
  ILoadTester,
  IMetricsCollector,
  IMonitoringSystem,
  IPerformanceMonitor,
  ISystemHealthMonitor,
  PerformanceReport,
  SystemHealthStatus,
} from './IMonitoring.js';

// Export AccessControlEntry from one source to avoid conflicts
export type { AccessControlEntry } from './IMCPResource.js';
