import { EventEmitter } from 'events';
export interface MCPIntegrationConfig {
    orchestrator?: {
        enabled: boolean;
        maxConcurrentTasks: number;
        taskTimeout: number;
    };
    browserAutomation?: {
        enabled: boolean;
        maxSessions: number;
        headless: boolean;
    };
    security?: {
        enabled: boolean;
        jwtSecret: string;
        encryptionKey: string;
        sessionTimeout: number;
    };
    communication?: {
        enabled: boolean;
        port: number;
        maxConnections: number;
    };
    monitoring?: {
        enabled: boolean;
        metricsInterval: number;
        alertThresholds: any;
    };
    plugins?: {
        enabled: boolean;
        storageRoot: string;
        sandboxed: boolean;
    };
}
export interface MCPCapabilityStatus {
    name: string;
    enabled: boolean;
    status: 'initializing' | 'active' | 'error' | 'disabled';
    lastError?: string;
    metrics?: any;
}
/**
 * Integration layer for advanced MCP capabilities
 * Provides unified interface for managing all advanced features
 */
export declare class MCPIntegrationLayer extends EventEmitter {
    private orchestrator?;
    private browserAutomation?;
    private security?;
    private communication?;
    private monitoring?;
    private plugins?;
    private config;
    private initialized;
    private capabilities;
    constructor(config: MCPIntegrationConfig);
    private initializeCapabilityStatus;
    /**
     * Initialize all enabled capabilities
     */
    initialize(): Promise<void>;
    private initializeOrchestrator;
    private initializeBrowserAutomation;
    private initializeSecurity;
    private initializeCommunication;
    private initializeMonitoring;
    private initializePlugins;
    private updateCapabilityStatus;
    /**
     * Get status of all capabilities
     */
    getCapabilityStatus(): MCPCapabilityStatus[];
    /**
     * Get specific capability instance
     */
    getCapability(name: string): any;
    /**
     * Execute a cross-capability operation
     */
    executeOperation(operation: {
        type: string;
        capabilities: string[];
        params: any;
    }): Promise<any>;
    private performHealthCheck;
    private getCapabilityMetrics;
    /**
     * Shutdown all capabilities
     */
    shutdown(): Promise<void>;
    /**
     * Check if integration layer is initialized
     */
    isInitialized(): boolean;
    /**
     * Get configuration
     */
    getConfig(): MCPIntegrationConfig;
}
export default MCPIntegrationLayer;
//# sourceMappingURL=MCPIntegrationLayer.d.ts.map