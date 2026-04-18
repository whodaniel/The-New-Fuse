/**
 * Core MCP Protocol Interfaces
 *
 * This module defines the fundamental interfaces for the Model Context Protocol (MCP)
 * implementation, including server, client, and broker interfaces.
 */

export { AgentStatus } from './IMCPAgentIntegration';
export type {
  Agent,
  AgentCapabilityDiscovery,
  AgentCollaboration,
  AgentMCPEndpoint,
  AgentMessageResult,
  AgentMessageRouting,
  AgentRegistrationResult,
  IMCPAgentIntegration,
} from './IMCPAgentIntegration';
export type { IMCPBroker } from './IMCPBroker';
export type {
  CapabilityDependency,
  CapabilityMetadata,
  CapabilityMetrics,
  CapabilityRegistry,
  CapabilityStatus,
  MCPCapability,
} from './IMCPCapability';
export type { IMCPClient } from './IMCPClient';
export type {
  AuthConfig,
  ConnectionMetrics,
  ConnectionOptions,
  ConnectionStatus,
  IConnectionManager,
  MCPConnection,
  TLSConfig,
} from './IMCPConnection';
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
} from './IMCPMessage';
export type {
  MCPResource,
  ResourceCaching,
  ResourceCallback,
  ResourceContent,
  ResourceHandler,
  ResourcePermissions,
} from './IMCPResource';
export type { IMCPServer } from './IMCPServer';
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
} from './IMCPServiceMesh';
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
} from './IMCPTool';
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
} from './IMCPWorkflowIntegration';
export type { EventCallback, IMessageRouter } from './IMessageRouter';
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
} from './IMonitoring';

// Export AccessControlEntry from one source to avoid conflicts
export type { AccessControlEntry } from './IMCPResource';
