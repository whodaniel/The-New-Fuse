/**
 * MCP Core Package
 *
 * This is the main entry point for the MCP (Model Context Protocol) core package.
 * It provides all the essential interfaces, types, and utilities needed to implement
 * MCP servers, clients, and brokers according to the MCP specification.
 */

// Core interfaces
export type {
  Agent,
  IConnectionManager,
  IMCPBroker,
  IMCPClient,
  IMCPServer,
  MCPCapability,
  MCPConnection,
  MCPResource,
  MCPTool,
} from './interfaces.js';

export { AgentStatus } from './interfaces.js';

// Core message types
export type {
  MCPMessage,
  MCPNotification,
  MCPRequest,
  MCPResponse,
} from './interfaces/IMCPMessage.js';

// Connection types
export type { ConnectionOptions, ConnectionStatus } from './interfaces/IMCPConnection.js';

// Resource types
export type {
  ResourceCaching,
  ResourceCallback,
  ResourceContent,
  ResourcePermissions,
} from './interfaces/IMCPResource.js';

// Service Mesh types
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
} from './interfaces/IMCPServiceMesh.js';

// Tool-related types
export type {
  JSONSchema,
  RateLimitConfig,
  ResourceLimits,
  ToolConfig,
  ToolExecutionMetadata,
  ToolPermissions,
  ToolResult,
  ToolUsageStats,
  ValidationResult,
} from './interfaces/IMCPTool.js';

// Core types
export type {
  LoadBalancingStrategy,
  LogLevel,
  MCPServerConfig,
  MCPServerInfo,
  MCPServiceInfo,
  ServiceStatus,
} from './types.js';

// Skill types (used by workflow-engine and agent packages)
export type { ResourceRequirement, Skill } from './types.js';

// Error types and classes
export {
  ErrorCategory,
  ErrorSeverity,
  JSONRPCErrorCode,
  MCPErrorClass,
  MCPErrorCode,
} from './types/error.js';

// Validation utilities
export { MessageSerializer, MessageValidator, SerializationUtils } from './validation.js';

export type {
  DeserializationResult,
  ValidationResult as MessageValidationResult,
  SerializationResult,
} from './validation.js';

// Handler base classes
export * from './handlers.js';

// Server implementation
export { MCPServer } from './server.js';

// Client implementation
export * from './client.js';

// Broker implementation
export * from './broker.js';

// Factory for integrated system
export * from './factory.js';

// Integration bridges
export {
  MCPAgentIntegration,
  MCPServiceMesh,
  MCPWorkflowIntegration,
  ServiceMeshMonitor,
  ServiceMeshScaler,
  WorkflowExecutionMonitor,
} from './integrations.js';

// Authentication and authorization
export * from './auth.js';

// Monitoring and metrics (prefer monitoring over integrations for Alert types)
export * from './monitoring.js';

// Performance optimization
export {
  CacheFactory,
  ConnectionPoolFactory,
  LRUCache,
  LoadTestRunner,
  MultiLevelCache,
  OptimizedConnectionPool,
  PerformanceValidator,
} from './performance.js';

// Version information
export const VERSION = '1.0.0';
export const MCP_VERSION = '2024-11-05';

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
  name: '@the-new-fuse/mcp-core',
  version: VERSION,
  mcpVersion: MCP_VERSION,
  description: 'Model Context Protocol (MCP) core implementation for The New Fuse',
  author: 'The New Fuse Team',
  license: 'MIT',
} as const;
