import { EventEmitter } from 'events';
/**
 * MCP Tool interface
 */
export interface MCPTool {
    name: string;
    description: string;
    parameters: Record<string, {
        type: string;
        description: string;
        required?: boolean;
        enum?: string[];
    }>;
    returnSchema?: Record<string, any>;
}
/**
 * MCP Tool Invocation Request
 */
export interface ToolRequest {
    toolName: string;
    parameters: Record<string, any>;
    requestId: string;
    callerId?: string;
}
/**
 * MCP Tool Invocation Response
 */
export interface ToolResponse {
    toolName: string;
    requestId: string;
    success: boolean;
    result?: any;
    error?: string;
    timestamp: string;
}
/**
 * MCP Service Options
 */
export interface MCPServiceOptions {
    agentId: string;
    agentName: string;
    debug?: boolean;
}
/**
 * Model Context Protocol (MCP) Service
 *
 * Provides a standardized way for agents to discover and invoke tools.
 * This service is focused on agent-tool interactions, separate from
 * direct agent-to-agent communication.
 */
export declare class MCPService extends EventEmitter {
    private agentId;
    private agentName;
    private debug;
    private availableTools;
    private toolHandlers;
    constructor(options: MCPServiceOptions);
    /**
     * Initialize the service
     */
    initialize(): Promise<void>;
    /**
     * Register a tool with the MCP service
     */
    registerTool(tool: MCPTool, handler: (params: Record<string, any>) => Promise<any>): void;
    /**
     * Get all available tools
     */
    getTools(): MCPTool[];
    /**
     * Invoke a tool by name
     */
    invokeTool(request: ToolRequest): Promise<ToolResponse>;
    /**
     * Validate parameters against tool schema
     */
    private validateParameters;
    /**
     * Utility method for logging
     */
    private log;
}
//# sourceMappingURL=MCPService.d.ts.map