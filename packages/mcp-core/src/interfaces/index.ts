/**
 * Core MCP Protocol Interfaces
 * 
 * This module defines the fundamental interfaces for the Model Context Protocol (MCP)
 * implementation, including server, client, and broker interfaces.
 */

export type { IMCPServer } from './IMCPServer';
export type { IMCPClient } from './IMCPClient';
export type { IMCPBroker } from './IMCPBroker';
export type { 
  JSONRPCMessage, 
  JSONRPCRequest, 
  JSONRPCResponse, 
  JSONRPCNotification, 
  JSONRPCError,
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPError,
  MCPMessage,
  JSONRPCMessage_Union
} from './IMCPMessage';
export type { 
  ResourceHandler, 
  MCPResource, 
  ResourceContent, 
  ResourcePermissions, 
  ResourceCaching, 
  ResourceCallback 
} from './IMCPResource';
export type { 
  JSONSchema,
  ValidationResult,
  ToolResult,
  ToolExecutionMetadata,
  ToolHandler,
  ToolUsageStats,
  MCPTool,
  ToolConfig,
  ResourceLimits,
  ToolPermissions,
  RateLimitConfig
} from './IMCPTool';
export type { 
  MCPCapability, 
  CapabilityMetadata, 
  CapabilityDependency, 
  CapabilityStatus, 
  CapabilityMetrics, 
  CapabilityRegistry 
} from './IMCPCapability';
export type { 
  ConnectionStatus,
  AuthConfig,
  TLSConfig,
  ConnectionOptions,
  ConnectionMetrics,
  MCPConnection,
  IConnectionManager
} from './IMCPConnection';
export type { 
  IMessageRouter,
  EventCallback
} from './IMessageRouter';
export type {
  IMCPWorkflowIntegration,
  WorkflowStep,
  WorkflowContext,
  StepResult,
  Task,
  TaskResult,
  ExecutionStatus,
  MCPCallback,
  TaskExecutionStatus,
  AuthContext,
  ErrorRecoveryConfig,
  MonitoringConfig
} from './IMCPWorkflowIntegration';
export type {
  IMCPAgentIntegration,
  Agent,
  AgentMCPEndpoint,
  AgentMessageRouting,
  AgentCollaboration,
  AgentCapabilityDiscovery,
  AgentRegistrationResult,
  AgentMessageResult
} from './IMCPAgentIntegration';
export { AgentStatus } from './IMCPAgentIntegration';
export type {
  IMCPServiceMesh,
  ServiceMeshRegistration,
  ServiceEndpoint,
  ServiceMeshHealthCheck,
  ServiceMeshLoadBalancing,
  CircuitBreakerConfig,
  ServiceMeshQuery,
  ServiceMeshMetrics,
  ServiceScalingConfig,
  ScalingPolicy,
  ServiceMeshIntegrationResult,
  AutoDiscoveryConfig,
  ServiceMeshIntegrationStatus,
  ScalingEvent
} from './IMCPServiceMesh';
export type {
  IMonitoringSystem,
  IMetricsCollector,
  IAlertManager,
  IDashboardManager,
  IPerformanceMonitor,
  ILoadTester,
  ICacheMonitor,
  IConnectionPoolMonitor,
  ISystemHealthMonitor,
  AlertRule,
  PerformanceReport,
  SystemHealthStatus,
  HealthCheck,
  HealthCheckResult
} from './IMonitoring';

// Export AccessControlEntry from one source to avoid conflicts
export type { AccessControlEntry } from './IMCPResource';