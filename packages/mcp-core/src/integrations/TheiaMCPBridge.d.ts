/**
 * Theia MCP Bridge
 *
 * This bridge integrates mcp-core with Theia IDE, providing MCP server
 * functionality that's compatible with Theia's AI features and MCP expectations.
 */
import { MCPServer } from '../server/MCPServer';
import { LogLevel } from '../types/common';
/**
 * Configuration for Theia MCP Bridge
 */
export interface TheiaMCPBridgeConfig {
    /** MCP server configuration for Theia */
    server: {
        name: string;
        version: string;
        port?: number;
        host?: string;
        enableAuth: boolean;
        logLevel: LogLevel;
    };
    /** Theia-specific configuration */
    theia: {
        /** Enable AI chat features */
        enableAIFeatures: boolean;
        /** Enable MCP tool integration */
        enableToolIntegration: boolean;
        /** Enable resource access from Theia */
        enableResourceAccess: boolean;
        /** Workspace root path */
        workspaceRoot?: string;
    };
    /** Bridge options */
    options?: {
        /** Enable stdio transport for Theia MCP */
        enableStdioTransport: boolean;
        /** Enable WebSocket transport */
        enableWebSocketTransport: boolean;
        /** Enable file system access */
        enableFileSystemAccess: boolean;
        /** Enable git integration */
        enableGitIntegration: boolean;
        /** Enable terminal access */
        enableTerminalAccess: boolean;
    };
}
/**
 * Theia MCP Bridge implementation
 */
export declare class TheiaMCPBridge {
    private mcpSystem;
    private config;
    private isInitialized;
    private stdioTransport;
    constructor(config: TheiaMCPBridgeConfig);
    /**
     * Initialize the Theia MCP bridge
     */
    initialize(): Promise<void>;
    /**
     * Start the Theia MCP bridge
     */
    start(): Promise<void>;
    /**
     * Stop the Theia MCP bridge
     */
    stop(): Promise<void>;
    /**
     * Get the MCP server instance
     */
    getMCPServer(): MCPServer;
    /**
     * Check if the bridge is running
     */
    isRunning(): boolean;
    /**
     * Register Theia-specific resources
     */
    private registerTheiaResources;
    /**
     * Register Theia-specific tools
     */
    private registerTheiaTools;
    /**
     * Setup stdio transport for Theia MCP integration
     */
    private setupStdioTransport;
    /**
     * Create Theia-compatible server configuration
     */
    static createTheiaCompatibleServer(config?: Partial<TheiaMCPBridgeConfig>): TheiaMCPBridge;
    /**
     * Register with Theia's MCP system
     */
    static registerWithTheia(server: MCPServer): Promise<void>;
}
/**
 * Factory function for creating Theia MCP bridges
 */
export declare function createTheiaMCPBridge(config?: Partial<TheiaMCPBridgeConfig>): TheiaMCPBridge;
/**
 * Default export for convenience
 */
export default TheiaMCPBridge;
//# sourceMappingURL=TheiaMCPBridge.d.ts.map