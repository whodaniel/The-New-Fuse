/**
 * Relay Core Integration
 *
 * This module provides integration with The New Fuse Relay Core package,
 * enabling MCP services to participate in the platform's communication relay system.
 */
export interface RelayIntegrationConfig {
    enabled: boolean;
    autoRegister: boolean;
    heartbeatInterval: number;
    retryAttempts: number;
    retryDelay: number;
    namespace: string;
}
export interface RelayServiceInfo {
    id: string;
    name: string;
    type: 'mcp-server' | 'mcp-client' | 'mcp-broker';
    version: string;
    endpoint: string;
    capabilities: string[];
    metadata: {
        protocol: 'mcp';
        mcpVersion: string;
        resources: any[];
        tools: any[];
        [key: string]: any;
    };
    health: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        lastCheck: Date;
        responseTime: number;
    };
}
/**
 * Relay Core Integration Bridge
 * Connects MCP Core with the platform's relay communication system
 */
export declare const RelayIntegration: {
    isAvailable: boolean;
    /**
     * Register MCP service with relay core
     */
    registerMCPService(serviceInfo: any, config?: Partial<RelayIntegrationConfig>): Promise<boolean>;
    /**
     * Unregister MCP service from relay core
     */
    unregisterMCPService(serviceId: string): Promise<boolean>;
    /**
     * Get shared configuration from relay core
     */
    getSharedConfig(key?: string): any;
    /**
     * Send message through relay core
     */
    sendMessage(targetService: string, message: any, options?: {
        timeout?: number;
        priority?: "low" | "normal" | "high" | "critical";
        retries?: number;
    }): Promise<any>;
    /**
     * Subscribe to relay core events
     */
    subscribeToEvents(eventTypes: string[], callback: (event: any) => void): () => void;
    /**
     * Publish event to relay core
     */
    publishEvent(eventType: string, data: any, metadata?: any): Promise<boolean>;
    /**
     * Get service discovery from relay core
     */
    discoverServices(query?: {
        type?: string;
        capabilities?: string[];
        tags?: string[];
        namespace?: string;
    }): Promise<RelayServiceInfo[]>;
    /**
     * Setup heartbeat for service health monitoring
     */
    setupHeartbeat(serviceId: string, config: Partial<RelayIntegrationConfig>): NodeJS.Timeout | null;
    /**
     * Get relay core status and metrics
     */
    getRelayStatus(): Promise<{
        connected: boolean;
        services: number;
        messagesSent: number;
        messagesReceived: number;
        lastActivity: Date;
    }>;
};
/**
 * Default configuration for relay integration
 */
export declare const DEFAULT_RELAY_CONFIG: RelayIntegrationConfig;
/**
 * Relay Core Event Types for MCP
 */
export declare const MCP_RELAY_EVENTS: {
    readonly SERVICE_REGISTERED: "service.registered";
    readonly SERVICE_UNREGISTERED: "service.unregistered";
    readonly SERVICE_HEALTH_CHANGED: "service.health.changed";
    readonly MESSAGE_SENT: "message.sent";
    readonly MESSAGE_RECEIVED: "message.received";
    readonly MESSAGE_FAILED: "message.failed";
    readonly CONNECTION_ESTABLISHED: "connection.established";
    readonly CONNECTION_LOST: "connection.lost";
    readonly ERROR_OCCURRED: "error.occurred";
};
/**
 * Relay Integration Factory
 * Creates pre-configured relay integration instances
 */
export declare class RelayIntegrationFactory {
    static create(config?: Partial<RelayIntegrationConfig>): {
        config: {
            enabled: boolean;
            autoRegister: boolean;
            heartbeatInterval: number;
            retryAttempts: number;
            retryDelay: number;
            namespace: string;
        };
        integration: {
            isAvailable: boolean;
            /**
             * Register MCP service with relay core
             */
            registerMCPService(serviceInfo: any, config?: Partial<RelayIntegrationConfig>): Promise<boolean>;
            /**
             * Unregister MCP service from relay core
             */
            unregisterMCPService(serviceId: string): Promise<boolean>;
            /**
             * Get shared configuration from relay core
             */
            getSharedConfig(key?: string): any;
            /**
             * Send message through relay core
             */
            sendMessage(targetService: string, message: any, options?: {
                timeout?: number;
                priority?: "low" | "normal" | "high" | "critical";
                retries?: number;
            }): Promise<any>;
            /**
             * Subscribe to relay core events
             */
            subscribeToEvents(eventTypes: string[], callback: (event: any) => void): () => void;
            /**
             * Publish event to relay core
             */
            publishEvent(eventType: string, data: any, metadata?: any): Promise<boolean>;
            /**
             * Get service discovery from relay core
             */
            discoverServices(query?: {
                type?: string;
                capabilities?: string[];
                tags?: string[];
                namespace?: string;
            }): Promise<RelayServiceInfo[]>;
            /**
             * Setup heartbeat for service health monitoring
             */
            setupHeartbeat(serviceId: string, config: Partial<RelayIntegrationConfig>): NodeJS.Timeout | null;
            /**
             * Get relay core status and metrics
             */
            getRelayStatus(): Promise<{
                connected: boolean;
                services: number;
                messagesSent: number;
                messagesReceived: number;
                lastActivity: Date;
            }>;
        };
        initialize(): Promise<boolean>;
        registerService(serviceInfo: any): Promise<boolean>;
        createEventBridge(): {
            subscribe: (eventType: string, callback: (event: any) => void) => () => void;
            publish: (eventType: string, data: any, metadata?: any) => Promise<boolean>;
            cleanup: () => void;
        };
    };
}
export default RelayIntegration;
//# sourceMappingURL=relay-core.d.ts.map