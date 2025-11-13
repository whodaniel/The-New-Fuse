/**
 * MCP Core Package
 *
 * This is the main entry point for the MCP (Model Context Protocol) core package.
 * It provides all the essential interfaces, types, and utilities needed to implement
 * MCP servers, clients, and brokers according to the MCP specification.
 */
export type { IMCPServer, IMCPClient, IMCPBroker, MCPResource, MCPTool, MCPCapability, ResourceHandler, ToolHandler, MCPConnection, IConnectionManager } from './interfaces';
export type { MCPRequest, MCPResponse, MCPNotification, MCPMessage } from './interfaces/IMCPMessage';
export type { ConnectionOptions, ConnectionStatus } from './interfaces/IMCPConnection';
export type { MCPServerConfig, MCPServerInfo, MCPServiceInfo, ServiceStatus, LoadBalancingStrategy, LogLevel } from './types';
export type { ToolResult, JSONSchema, ValidationResult, ToolExecutionMetadata, ToolUsageStats, ToolConfig, ResourceLimits, ToolPermissions, RateLimitConfig } from './interfaces';
export { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode, ErrorCategory, ErrorSeverity } from './types/error';
export { MessageValidator, MessageSerializer, SerializationUtils } from './validation';
export type { ValidationResult as MessageValidationResult, SerializationResult, DeserializationResult } from './validation';
export * from './handlers';
export { MCPServer } from './server';
export * from './client';
export * from './broker';
export * from './factory';
export { MCPWorkflowIntegration, MCPAgentIntegration, MCPServiceMesh, WorkflowExecutionMonitor, ServiceMeshMonitor, ServiceMeshScaler } from './integrations';
export * from './auth';
export * from './monitoring';
export { LRUCache, MultiLevelCache, CacheFactory, PerformanceValidator, OptimizedConnectionPool, ConnectionPoolFactory, LoadTestRunner } from './performance';
export declare const VERSION = "1.0.0";
export declare const MCP_VERSION = "2024-11-05";
/**
 * Package metadata
 */
export declare const PACKAGE_INFO: {
    readonly name: "@the-new-fuse/mcp-core";
    readonly version: "1.0.0";
    readonly mcpVersion: "2024-11-05";
    readonly description: "Model Context Protocol (MCP) core implementation for The New Fuse";
    readonly author: "The New Fuse Team";
    readonly license: "MIT";
};
//# sourceMappingURL=index.d.ts.map