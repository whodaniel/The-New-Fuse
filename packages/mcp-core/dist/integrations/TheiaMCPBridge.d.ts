/**
 * SkIDEancer MCP Bridge
 *
 * This bridge integrates mcp-core with SkIDEancer IDE, providing MCP server
 * functionality that's compatible with SkIDEancer's AI features and MCP expectations.
 */
import { MCPServer } from '../server/MCPServer.js';
import { LogLevel } from '../types/common.js';
/**
 * Configuration for SkIDEancer MCP Bridge
 */
export interface SkIDEancerMCPBridgeConfig {
    /** MCP server configuration for SkIDEancer */
    server: {
        name: string;
        version: string;
        port?: number;
        host?: string;
        enableAuth: boolean;
        logLevel: LogLevel;
    };
    /** SkIDEancer-specific configuration */
    ide: {
        /** Enable AI chat features */
        enableAIFeatures: boolean;
        /** Enable MCP tool integration */
        enableToolIntegration: boolean;
        /** Enable resource access from SkIDEancer */
        enableResourceAccess: boolean;
        /** Workspace root path */
        workspaceRoot?: string;
    };
    /** Bridge options */
    options?: {
        /** Enable stdio transport for SkIDEancer MCP */
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
 * SkIDEancer MCP Bridge implementation
 */
export declare class SkIDEancerMCPBridge {
    private mcpSystem;
    private config;
    private isInitialized;
    private stdioTransport;
    constructor(config: SkIDEancerMCPBridgeConfig);
    /**
     * Initialize the SkIDEancer MCP bridge
     */
    initialize(): Promise<void>;
    /**
     * Start the SkIDEancer MCP bridge
     */
    start(): Promise<void>;
    /**
     * Stop the SkIDEancer MCP bridge
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
     * Register SkIDEancer-specific resources
     */
    private registerSkIDEancerResources;
    /**
     * Register SkIDEancer-specific tools
     */
    private registerSkIDEancerTools;
    /**
     * Setup stdio transport for SkIDEancer MCP integration
     */
    private setupStdioTransport;
    /**
     * Create SkIDEancer-compatible server configuration
     */
    static createSkIDEancerCompatibleServer(config?: Partial<SkIDEancerMCPBridgeConfig>): SkIDEancerMCPBridge;
    /**
     * Register with SkIDEancer's MCP system
     */
    static registerWithSkIDEancer(server: MCPServer): Promise<void>;
}
/**
 * Factory function for creating SkIDEancer MCP bridges
 */
export declare function createSkIDEancerMCPBridge(config?: Partial<SkIDEancerMCPBridgeConfig>): SkIDEancerMCPBridge;
/**
 * Default export for convenience
 */
export default SkIDEancerMCPBridge;
//# sourceMappingURL=TheiaMCPBridge.d.ts.map