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

// Export AccessControlEntry from one source to avoid conflicts
export type { AccessControlEntry } from './IMCPResource';