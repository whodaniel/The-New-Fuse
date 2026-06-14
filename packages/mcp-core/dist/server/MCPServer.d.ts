/**
 * MCP Server Implementation
 *
 * This class implements the IMCPServer interface providing a complete MCP server
 * with JSON-RPC 2.0 compliance, resource/tool registration, and request handling.
 */
import { EventEmitter } from 'events';
import { IMCPServer } from '../interfaces/IMCPServer.js';
import { MCPRequest, MCPResponse } from '../interfaces/IMCPMessage.js';
import { MCPResource } from '../interfaces/IMCPResource.js';
import { MCPTool } from '../interfaces/IMCPTool.js';
import { MCPCapability } from '../interfaces/IMCPCapability.js';
import { MCPServerConfig, MCPServerInfo } from '../types/server.js';
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
    private wss;
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
    registerTool(tool: MCPTool, handler?: any): void;
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
     * Setup request processing infrastructure
     */
    private setupRequestProcessing;
    /**
     * Setup resource handlers
     */
    private setupResourceHandlers;
    /**
     * Setup tool handlers
     */
    private setupToolHandlers;
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
     * Handle initialize request
     */
    private handleInitialize;
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
     * Handle resource subscribe request
     */
    private handleResourceSubscribe;
    /**
     * Handle resource unsubscribe request
     */
    private handleResourceUnsubscribe;
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
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage;
}
//# sourceMappingURL=MCPServer.d.ts.map