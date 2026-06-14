/**
 * MCP Integration bridges and Platform Integrations
 *
 * This module provides integration bridges for connecting MCP core
 * with other platform components and The New Fuse ecosystem.
 */
export { createRelayBridge, RelayBridge, replaceMCPTransport, type RelayBridgeConfig, } from './RelayBridge.js';
export { createSkIDEancerMCPBridge, SkIDEancerMCPBridge, type SkIDEancerMCPBridgeConfig, } from './TheiaMCPBridge.js';
export { MCPSystemFactory, type MCPSystem, type MCPSystemConfig, } from '../factory/MCPSystemFactory.js';
export * from './database.js';
export * from './platform-types.js';
export * from './relay-core.js';
export { MCPWorkflowIntegration, type MCPWorkflowIntegrationConfig, } from './MCPWorkflowIntegration.js';
export { MCPAgentIntegration, type MCPAgentIntegrationConfig } from './MCPAgentIntegration.js';
export { MCPCallbackHandler, type CallbackHandlerConfig, type CallbackProcessingResult, type CallbackQueueEntry, type CallbackRegistration, type CallbackStatistics, } from './MCPCallbackHandler.js';
export { MCPServiceMesh, type ServiceMeshConfig, type ServiceMeshProvider } from './MCPServiceMesh.js';
export { KubernetesServiceMeshProvider, type KubernetesConfig, } from './providers/KubernetesServiceMeshProvider.js';
export { ServiceMeshMonitor, type Alert, type AlertStatus, type MonitoringStatistics, type ServiceMeshMonitorConfig, type ServiceMonitoringData, } from './ServiceMeshMonitor.js';
export { ServiceMeshScaler, type ScalingDecision, type ScalingStatistics, type ServiceMeshScalerConfig, type ServiceScalingState, } from './ServiceMeshScaler.js';
export { WorkflowExecutionMonitor, type AlertConfig, type AlertEvent, type ExecutionEvent, type ExecutionHistoryEntry, type ExecutionMetrics, } from './WorkflowExecutionMonitor.js';
import { DatabaseIntegration, DatabaseIntegrationFactory } from './database.js';
import { PlatformTypesBridge, PlatformUtils } from './platform-types.js';
import { RelayIntegration, RelayIntegrationFactory } from './relay-core.js';
/**
 * Platform Integration Manager
 * Orchestrates all platform integrations for MCP Core
 */
export declare class PlatformIntegrationManager {
    private static instance;
    private initialized;
    private integrations;
    private config;
    private constructor();
    static getInstance(): PlatformIntegrationManager;
    /**
     * Initialize all platform integrations
     */
    initialize(config?: any): Promise<{
        success: boolean;
        integrations: {
            platformTypes: boolean;
            relayCore: boolean;
            database: boolean;
        };
        errors: string[];
    }>;
    /**
     * Register MCP service with all available integrations
     */
    registerService(serviceInfo: any): Promise<{
        success: boolean;
        results: {
            platformTypes: boolean;
            relayCore: boolean;
            database: boolean;
        };
        errors: string[];
    }>;
    /**
     * Get integration status
     */
    getStatus(): {
        initialized: boolean;
        integrations: {
            platformTypes: {
                available: boolean;
                enabled: boolean;
            };
            relayCore: {
                available: boolean;
                enabled: boolean;
            };
            database: {
                available: boolean;
                enabled: boolean;
            };
        };
        config: {
            platformTypes: {
                enabled: boolean;
            };
            relayCore: {
                enabled: boolean;
                autoRegister: boolean;
            };
            database: {
                enabled: boolean;
                enableMetrics: boolean;
                enableAuditLog: boolean;
            };
        };
    };
    /**
     * Check if running in platform environment
     */
    isPlatformEnvironment(): boolean;
}
/**
 * Global platform integration instance
 */
export declare const platformIntegration: PlatformIntegrationManager;
/**
 * Convenience functions for common integration tasks
 */
export declare const IntegrationUtils: {
    /**
     * Initialize all integrations with default configuration
     */
    initializeAll(config?: any): Promise<{
        success: boolean;
        integrations: {
            platformTypes: boolean;
            relayCore: boolean;
            database: boolean;
        };
        errors: string[];
    }>;
    /**
     * Register service with automatic platform integration
     */
    registerService(serviceInfo: any): Promise<{
        success: boolean;
        results: {
            platformTypes: boolean;
            relayCore: boolean;
            database: boolean;
        };
        errors: string[];
    }>;
    /**
     * Get current integration status
     */
    getIntegrationStatus(): {
        initialized: boolean;
        integrations: {
            platformTypes: {
                available: boolean;
                enabled: boolean;
            };
            relayCore: {
                available: boolean;
                enabled: boolean;
            };
            database: {
                available: boolean;
                enabled: boolean;
            };
        };
        config: {
            platformTypes: {
                enabled: boolean;
            };
            relayCore: {
                enabled: boolean;
                autoRegister: boolean;
            };
            database: {
                enabled: boolean;
                enableMetrics: boolean;
                enableAuditLog: boolean;
            };
        };
    };
};
export { DatabaseIntegration, DatabaseIntegrationFactory, PlatformTypesBridge, PlatformUtils, RelayIntegration, RelayIntegrationFactory, };
export default PlatformIntegrationManager;
//# sourceMappingURL=index.d.ts.map