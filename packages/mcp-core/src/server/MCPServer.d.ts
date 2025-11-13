/**
 * MCP Server Implementation
 *
 * This class implements the IMCPServer interface providing a complete MCP server
 * with JSON-RPC 2.0 compliance, resource/tool registration, and request handling.
 */
import { EventEmitter } from 'events';
import { IMCPServer } from '../interfaces/IMCPServer';
import { MCPRequest, MCPResponse } from '../interfaces/IMCPMessage';
import { MCPResource } from '../interfaces/IMCPResource';
import { MCPTool } from '../interfaces/IMCPTool';
import { MCPCapability } from '../interfaces/IMCPCapability';
import { MCPServerConfig, MCPServerInfo } from '../types/server';
/**
 * Core MCP Server implementation
 */
export declare class MCPServer extends EventEmitter implements IMCPServer {
    private config;
    private running;
    private startTime;
    private resources;
    private tools;
    private capabilities;
    private activeConnections;
    private requestCount;
    private successfulRequests;
    private failedRequests;
    private totalResponseTime;
    private messageValidator;
    constructor();
    /**
     * Start the MCP server with the provided configuration
     */
    start(config: MCPServerConfig): Promise<void>;
    /**
     * Stop the MCP server gracefully
     */
    stop(): Promise<void>;
    /**
     * Register a resource with the MCP server
     */
    registerResource(resource: MCPResource): void;
    /**
     * Register a tool with the MCP server
     */
    registerTool(tool: MCPTool): void;
    /**
     * Register a capability with the MCP server
     */
    registerCapability(capability: MCPCapability): void;
    /**
     * Handle an incoming MCP request according to JSON-RPC 2.0 specification
     */
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    /**
     * Get server information including capabilities and status
     */
    getServerInfo(): MCPServerInfo;
    /**
     * Check if the server is currently running
     */
    isRunning(): boolean;
    /**
     * Get the list of registered resources
     */
    getRegisteredResources(): MCPResource[];
    /**
     * Get the list of registered tools
     */
    getRegisteredTools(): MCPTool[];
    /**
     * Get the list of registered capabilities
     */
    getRegisteredCapabilities(): MCPCapability[];
    /**
     * Private method to validate server configuration
     */
    private validateConfig;
    /**
     * Private method to initialize server components
     */
    private initializeServer;
    /**
     * Private method to setup event handlers
     */
    private setupEventHandlers;
    /**
     * Private method to setup request handlers
     */
    private setupRequestHandlers;
    /**
     * Private method to register default capabilities
     */
    private registerDefaultCapabilities;
    /**
     * Private method to process individual requests
     */
    private processRequest;
    /**
     * Handle server info request
     */
    private handleServerInfo;
    /**
     * Handle server ping request
     */
    private handleServerPing;
    /**
     * Handle resources list request
     */
    private handleResourcesList;
    /**
     * Handle resource read request
     */
    private handleResourceRead;
    /**
     * Handle tools list request
     */
    private handleToolsList;
    /**
     * Handle tool call request
     */
    private handleToolCall;
    /**
     * Convert error to MCP error format
     */
    private convertToMCPError;
    /**
     * Check if error code indicates a retryable error
     */
    private isRetryableError;
    /**
     * Wait for active connections to finish
     */
    private waitForActiveConnections;
    /**
     * Cleanup server resources
     */
    private cleanup;
    /**
     * Initialize logging
     */
    private initializeLogging;
    /**
     * Log message with specified level
     */
    private log;
}
//# sourceMappingURL=MCPServer.d.ts.map