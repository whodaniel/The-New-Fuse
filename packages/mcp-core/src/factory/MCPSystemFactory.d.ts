/**
 * MCP System Factory
 *
 * Unified factory for creating integrated MCP systems that work seamlessly
 * with relay-core, workflow-engine, and other platform components.
 */
import { MCPServer } from '../server/MCPServer';
import { MCPServerConfig } from '../types/server';
type Logger = {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
};
type MasterAgentRegistry = any;
type HeartbeatMonitoringService = any;
/**
 * Configuration for the integrated MCP system
 */
export interface MCPSystemConfig {
    /** MCP Server configuration */
    server: MCPServerConfig;
    /** Database configuration */
    database?: {
        prisma?: any;
        connectionString?: string;
    };
    /** Relay integration configuration */
    relay?: {
        enabled: boolean;
        agentRegistry?: MasterAgentRegistry;
        heartbeatService?: HeartbeatMonitoringService;
        logger?: Logger;
    };
    /** Workflow integration configuration */
    workflow?: {
        enabled: boolean;
        engineConfig?: any;
    };
    /** Theia integration configuration */
    theia?: {
        enabled: boolean;
        port?: number;
        aiFeatures?: boolean;
    };
    /** Monitoring configuration */
    monitoring?: {
        enabled: boolean;
        metricsPort?: number;
        prometheusEnabled?: boolean;
    };
    /** Development configuration */
    development?: {
        hotReload: boolean;
        debugMode: boolean;
        mockServices: boolean;
    };
}
/**
 * Integrated MCP System containing all components
 */
export interface MCPSystem {
    /** Core MCP Server */
    server: MCPServer;
    /** System configuration */
    config: MCPSystemConfig;
    /** Start the entire system */
    start(): Promise<void>;
    /** Stop the entire system */
    stop(): Promise<void>;
    /** Get system health status */
    getHealth(): Promise<SystemHealth>;
    /** Get system metrics */
    getMetrics(): Promise<SystemMetrics>;
    /** Register a new resource */
    registerResource(resource: any): Promise<void>;
    /** Register a new tool */
    registerTool(tool: any): Promise<void>;
    /** Get integrated components */
    getComponents(): SystemComponents;
}
/**
 * System health information
 */
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
        server: 'up' | 'down' | 'degraded';
        database?: 'up' | 'down' | 'degraded';
        relay?: 'up' | 'down' | 'degraded';
        workflow?: 'up' | 'down' | 'degraded';
        theia?: 'up' | 'down' | 'degraded';
    };
    timestamp: Date;
    uptime: number;
}
/**
 * System metrics information
 */
export interface SystemMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    resources: {
        registered: number;
        accessed: number;
    };
    tools: {
        registered: number;
        executed: number;
    };
    connections: {
        active: number;
        total: number;
    };
    timestamp: Date;
}
/**
 * System components
 */
export interface SystemComponents {
    server: MCPServer;
    database?: any;
    relay?: {
        agentRegistry?: MasterAgentRegistry;
        heartbeatService?: HeartbeatMonitoringService;
        logger?: Logger;
    };
    workflow?: any;
    theia?: any;
}
/**
 * MCP System Factory class
 */
export declare class MCPSystemFactory {
    /**
     * Create a production-ready MCP system
     */
    static createProductionSystem(config?: Partial<MCPSystemConfig>): MCPSystem;
    /**
     * Create a development MCP system
     */
    static createDevelopmentSystem(config?: Partial<MCPSystemConfig>): MCPSystem;
    /**
     * Create a testing MCP system
     */
    static createTestingSystem(config?: Partial<MCPSystemConfig>): MCPSystem;
    /**
     * Create a custom MCP system with full configuration
     */
    static createCustomSystem(config: MCPSystemConfig): MCPSystem;
    /**
     * Create a simple MCP server for testing
     * @deprecated Use createTestingSystem() instead for full system functionality
     */
    static createServer(config: MCPServerConfig): MCPServer;
    /**
     * Merge configuration objects deeply
     */
    private static mergeConfigs;
}
/**
 * Default export for convenience
 */
export default MCPSystemFactory;
//# sourceMappingURL=MCPSystemFactory.d.ts.map