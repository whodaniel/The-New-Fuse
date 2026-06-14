/**
 * MCP Core Package
 *
 * This is the main entry point for the MCP (Model Context Protocol) core package.
 * It provides all the essential interfaces, types, and utilities needed to implement
 * MCP servers, clients, and brokers according to the MCP specification.
 */
export type { Agent, IConnectionManager, IMCPBroker, IMCPClient, IMCPServer, MCPCapability, MCPConnection, MCPResource, MCPTool, } from './interfaces/index.js';
export { AgentStatus } from './interfaces/index.js';
export type { MCPMessage, MCPNotification, MCPRequest, MCPResponse, } from './interfaces/IMCPMessage.js';
export type { ConnectionOptions, ConnectionStatus } from './interfaces/IMCPConnection.js';
export type { ResourceCaching, ResourceCallback, ResourceContent, ResourcePermissions, } from './interfaces/IMCPResource.js';
export type { AutoDiscoveryConfig, CircuitBreakerConfig, IMCPServiceMesh, ScalingEvent, ScalingPolicy, ServiceEndpoint, ServiceMeshHealthCheck, ServiceMeshIntegrationResult, ServiceMeshIntegrationStatus, ServiceMeshLoadBalancing, ServiceMeshMetrics, ServiceMeshQuery, ServiceMeshRegistration, ServiceScalingConfig, } from './interfaces/IMCPServiceMesh.js';
export type { JSONSchema, RateLimitConfig, ResourceLimits, ToolConfig, ToolExecutionMetadata, ToolPermissions, ToolResult, ToolUsageStats, ValidationResult, } from './interfaces/IMCPTool.js';
export type { LoadBalancingStrategy, LogLevel, MCPServerConfig, MCPServerInfo, MCPServiceInfo, ServiceStatus, } from './types/index.js';
export type { ResourceRequirement, Skill } from './types/index.js';
export { ErrorCategory, ErrorSeverity, JSONRPCErrorCode, MCPErrorClass, MCPErrorCode, } from './types/error.js';
export { MessageSerializer, MessageValidator, SerializationUtils } from './validation/index.js';
export type { DeserializationResult, ValidationResult as MessageValidationResult, SerializationResult, } from './validation/index.js';
export * from './handlers/index.js';
export { MCPServer } from './server/index.js';
export * from './client/index.js';
export * from './broker/index.js';
export * from './factory/index.js';
export { MCPAgentIntegration, MCPServiceMesh, MCPWorkflowIntegration, ServiceMeshMonitor, ServiceMeshScaler, WorkflowExecutionMonitor, } from './integrations/index.js';
export * from './auth/index.js';
export * from './monitoring/index.js';
export { CacheFactory, ConnectionPoolFactory, LRUCache, LoadTestRunner, MultiLevelCache, OptimizedConnectionPool, PerformanceValidator, } from './performance/index.js';
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