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
} from './interfaces/index.js';

export { AgentStatus } from './interfaces/index.js';

// Core message types
export type {
  MCPMessage,
  MCPNotification,
  MCPRequest,
  MCPResponse,
} from './interfaces/IMCPMessage.js';

// Connection types
export type { ConnectionOptions, ConnectionStatus } from './interfaces/IMCPConnection.js';

// Core types
export type {
  LoadBalancingStrategy,
  LogLevel,
  MCPServerConfig,
  MCPServerInfo,
  MCPServiceInfo,
  ServiceStatus,
} from './types/index.js';

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
} from './interfaces/index.js';

// Error types and classes
export {
  ErrorCategory,
  ErrorSeverity,
  JSONRPCErrorCode,
  MCPErrorClass,
  MCPErrorCode,
} from './types/error.js';

// Validation utilities
export { MessageSerializer, MessageValidator, SerializationUtils } from './validation/index.js';

export type {
  DeserializationResult,
  ValidationResult as MessageValidationResult,
  SerializationResult,
} from './validation/index.js';

// Handler base classes
export * from './handlers/index.js';

// Server implementation
export { MCPServer } from './server/index.js';

// Client implementation
export * from './client/index.js';

// Broker implementation
export * from './broker/index.js';

// Factory for integrated system
export * from './factory/index.js';

// Integration bridges
export {
  MCPAgentIntegration,
  MCPServiceMesh,
  MCPWorkflowIntegration,
  ServiceMeshMonitor,
  ServiceMeshScaler,
  WorkflowExecutionMonitor,
} from './integrations/index.js';

// Authentication and authorization
export * from './auth/index.js';

// Monitoring and metrics (prefer monitoring over integrations for Alert types)
export * from './monitoring/index.js';

// Performance optimization
export {
  CacheFactory,
  ConnectionPoolFactory,
  LRUCache,
  LoadTestRunner,
  MultiLevelCache,
  OptimizedConnectionPool,
  PerformanceValidator,
} from './performance/index.js';

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
