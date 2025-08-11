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
  ResourceHandler,
  ToolHandler,
  MCPConnection,
  IConnectionManager
} from './interfaces';

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

// Broker implementation
export * from './broker';

// Factory for integrated system
export * from './factory';

// Integration bridges
export * from './integrations';

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