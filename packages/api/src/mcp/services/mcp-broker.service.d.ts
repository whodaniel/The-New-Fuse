/**
 * MCP Broker Service
 * Manages communication between MCP servers and clients
 */
export declare class MCPBrokerService {
    private readonly logger;
    private servers;
    private capabilities;
    private tools;
    private isInitialized;
    constructor();
    /**
     * Initialize the MCP Broker Service
     * Sets up connections and loads configuration
     */
    initialize(): Promise<void>;
    /**
     * Clean up resources used by the MCP Broker Service
     */
    cleanup(): Promise<void>;
    /**
     * Register a new MCP server
     * @param name Server name
     * @param server Server instance
     */
    registerServer(name: string, server: any): void;
    /**
     * Get all registered capabilities
     * @returns Map of capability names to handlers
     */
    getAllCapabilities(): string[];
    /**
     * Register a tool
     * @param name Tool name
     * @param handler Tool handler
     */
    registerTool(name: string, handler: any): void;
    /**
     * Get all registered tools
     * @returns Map of tool names to handlers
     */
    getAllTools(): string[];
    /**
     * Execute a directive on a server
     * @param serverName Server name
     * @param action Action to execute
     * @param params Action parameters
     * @param context Execution context
     * @returns Action result
     */
    executeDirective(serverName: string, action: string, params?: Record<string, any>, context?: {
        sender: string;
        metadata?: Record<string, any>;
    }): Promise<any>;
}
//# sourceMappingURL=mcp-broker.service.d.ts.map