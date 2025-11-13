/**
 * Relay Bridge for MCP Core Integration
 *
 * This bridge integrates mcp-core with relay-core, replacing the existing
 * MCPTransport with our unified MCPServer implementation while maintaining
 * backward compatibility.
 */
import { MCPServer } from '../server/MCPServer';
import { LogLevel } from '../types/common';
type Logger = {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
};
type MasterAgentRegistry = any;
type HeartbeatMonitoringService = any;
/**
 * Configuration for relay bridge integration
 */
export interface RelayBridgeConfig {
    /** MCP server configuration */
    server: {
        name: string;
        version: string;
        port: number;
        host: string;
        enableAuth: boolean;
        logLevel: LogLevel;
    };
    /** Relay components */
    relay: {
        agentRegistry: MasterAgentRegistry;
        heartbeatService?: HeartbeatMonitoringService;
        logger: Logger;
    };
    /** Bridge options */
    options?: {
        replaceExistingTransport: boolean;
        enableBackwardCompatibility: boolean;
        migrateExistingResources: boolean;
        enableMetrics: boolean;
    };
}
/**
 * Relay Bridge implementation
 */
export declare class RelayBridge {
    private mcpSystem;
    private config;
    private logger;
    private isInitialized;
    constructor(config: RelayBridgeConfig);
    /**
     * Initialize the relay bridge
     */
    initialize(): Promise<void>;
    /**
     * Start the relay bridge
     */
    start(): Promise<void>;
    /**
     * Stop the relay bridge
     */
    stop(): Promise<void>;
    /**
     * Get the MCP server instance
     */
    getMCPServer(): MCPServer;
    /**
     * Get the integrated MCP system
     */
    getMCPSystem(): any;
    /**
     * Check if the bridge is running
     */
    isRunning(): boolean;
    /**
     * Get bridge health status
     */
    getHealth(): Promise<any>;
    /**
     * Register relay-specific resources
     */
    private registerRelayResources;
    /**
     * Register relay-specific tools
     */
    private registerRelayTools;
    /**
     * Migrate existing resources from old MCP transport
     */
    private migrateExistingResources;
    /**
     * Create a backward compatibility adapter
     */
    createBackwardCompatibilityAdapter(): any;
}
/**
 * Factory function for creating relay bridges
 */
export declare function createRelayBridge(config: RelayBridgeConfig): RelayBridge;
/**
 * Helper function to replace existing MCPTransport with RelayBridge
 */
export declare function replaceMCPTransport(existingTransport: any, relayConfig: Omit<RelayBridgeConfig, 'server'>, serverConfig?: Partial<RelayBridgeConfig['server']>): Promise<RelayBridge>;
/**
 * Default export for convenience
 */
export default RelayBridge;
//# sourceMappingURL=RelayBridge.d.ts.map