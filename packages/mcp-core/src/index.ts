/**
 * MCP Core Package
 *
 * This is the main entry point for the MCP (Model Context Protocol) core package.
 * It provides all the essential interfaces, types, and utilities needed to implement
 * MCP servers, clients, and brokers according to the MCP specification.
 */

// Core interfaces
export type {
  IMCPServer,
  IMCPClient,
  IMCPBroker,
  MCPResource,
  MCPTool,
  MCPCapability,
  MCPConnection,
  IConnectionManager,
  Agent
} from './interfaces';

export { AgentStatus } from './interfaces';

// Core message types
export type {
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPMessage
} from './interfaces/IMCPMessage';

// Connection types
export type {
  ConnectionOptions,
  ConnectionStatus
} from './interfaces/IMCPConnection';

// Core types
export type {
  MCPServerConfig,
  MCPServerInfo,
  MCPServiceInfo,
  ServiceStatus,
  LoadBalancingStrategy,
  LogLevel
} from './types';

// Tool-related types
export type {
  ToolResult,
  JSONSchema,
  ValidationResult,
  ToolExecutionMetadata,
  ToolUsageStats,
  ToolConfig,
  ResourceLimits,
  ToolPermissions,
  RateLimitConfig
} from './interfaces';

// Error types and classes
export {
  MCPErrorClass,
  MCPErrorCode,
  JSONRPCErrorCode,
  ErrorCategory,
  ErrorSeverity
} from './types/error';

// Validation utilities
export {
  MessageValidator,
  MessageSerializer,
  SerializationUtils
} from './validation';

export type {
  ValidationResult as MessageValidationResult,
  SerializationResult,
  DeserializationResult
} from './validation';

// Handler base classes
export * from './handlers';

// Server implementation
export { MCPServer } from './server';

// Client implementation
export * from './client';

// Broker implementation
export * from './broker';

// Factory for integrated system
export * from './factory';

// Integration bridges
export {
  MCPWorkflowIntegration,
  MCPAgentIntegration,
  MCPServiceMesh,
  WorkflowExecutionMonitor,
  ServiceMeshMonitor,
  ServiceMeshScaler
} from './integrations';

// Authentication and authorization
export * from './auth';

// Monitoring and metrics (prefer monitoring over integrations for Alert types)
export * from './monitoring';

// Performance optimization
export {
  LRUCache,
  MultiLevelCache,
  CacheFactory,
  PerformanceValidator,
  OptimizedConnectionPool,
  ConnectionPoolFactory,
  LoadTestRunner
} from './performance';

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
  license: 'MIT'
} as const;
