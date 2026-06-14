/**
 * Platform Types Integration
 *
 * This module provides integration with The New Fuse shared types package,
 * ensuring compatibility between MCP Core and the broader platform ecosystem.
 */
export interface PlatformIntegrationConfig {
    enableSharedTypes: boolean;
    enableCommunicationBridge: boolean;
    enableDatabaseIntegration: boolean;
    enableRelayCore: boolean;
}
/**
 * Platform Types Bridge
 * Maps between MCP Core types and platform shared types
 */
export declare const PlatformTypesBridge: {
    isAvailable: boolean;
    /**
     * Map MCP Service Info to platform Agent type
     */
    mapServiceToAgent: (serviceInfo: any) => any;
    /**
     * Map platform Agent type to MCP Service Info
     */
    mapAgentToService: (agent: any) => {
        id: any;
        name: any;
        version: any;
        endpoint: any;
        capabilities: any;
        resources: any;
        tools: any;
        status: any;
        metadata: any;
        registeredAt: any;
        lastHeartbeat: any;
        healthScore: any;
        tags: any;
    } | null;
    /**
     * Get platform communication types
     */
    getCommunicationTypes: () => any;
    /**
     * Get platform authentication types
     */
    getAuthTypes: () => any;
    /**
     * Map MCP error to platform error format
     */
    mapError: (mcpError: any) => any;
    /**
     * Create platform-compatible event
     */
    createEvent: (eventType: string, data: any) => {
        id: string;
        type: string;
        source: string;
        timestamp: string;
        data: any;
        version: string;
    } | {
        type: string;
        data: any;
        id?: undefined;
        source?: undefined;
        timestamp?: undefined;
        version?: undefined;
    };
};
/**
 * Type definitions that extend platform types or provide fallbacks
 */
export interface MCPPlatformMessage {
    id: string;
    type: 'mcp.request' | 'mcp.response' | 'mcp.notification' | 'mcp.error';
    source: string;
    target?: string;
    timestamp: string;
    data: any;
    metadata?: {
        correlationId?: string;
        retryAttempt?: number;
        priority?: 'low' | 'normal' | 'high' | 'critical';
    };
}
export interface MCPPlatformAgent {
    id: string;
    name: string;
    version: string;
    type: 'mcp-service' | 'agent' | 'tool' | 'resource-provider';
    capabilities: string[];
    metadata: {
        mcpEndpoint?: string;
        mcpResources?: any[];
        mcpTools?: any[];
        mcpStatus?: string;
        healthScore?: number;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
}
export interface MCPPlatformEvent {
    id: string;
    type: string;
    source: string;
    timestamp: string;
    data: any;
    version: string;
    metadata?: {
        correlationId?: string;
        causedBy?: string;
        affectedResources?: string[];
    };
}
/**
 * Configuration for platform integration
 */
export declare const DEFAULT_PLATFORM_CONFIG: PlatformIntegrationConfig;
/**
 * Platform integration utilities
 */
export declare const PlatformUtils: {
    /**
     * Check if running in platform environment
     */
    isPlatformEnvironment: () => boolean;
    /**
     * Get platform configuration
     */
    getPlatformConfig: () => Partial<PlatformIntegrationConfig>;
    /**
     * Validate platform compatibility
     */
    validateCompatibility: () => {
        compatible: boolean;
        issues: string[];
    };
};
export default PlatformTypesBridge;
//# sourceMappingURL=platform-types.d.ts.map