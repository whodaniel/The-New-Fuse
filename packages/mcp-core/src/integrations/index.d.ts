/**
 * MCP Integration bridges and Platform Integrations
 *
 * This module provides integration bridges for connecting MCP core
 * with other platform components and The New Fuse ecosystem.
 */
export { RelayBridge, createRelayBridge, replaceMCPTransport, type RelayBridgeConfig } from './RelayBridge';
export { TheiaMCPBridge, createTheiaMCPBridge, type TheiaMCPBridgeConfig } from './TheiaMCPBridge';
export { MCPSystemFactory, type MCPSystemConfig, type MCPSystem } from '../factory/MCPSystemFactory';
export * from './platform-types';
export * from './relay-core';
export * from './database';
export { MCPWorkflowIntegration, type MCPWorkflowIntegrationConfig } from './MCPWorkflowIntegration';
export { MCPAgentIntegration, type MCPAgentIntegrationConfig } from './MCPAgentIntegration';
export { MCPServiceMesh, type ServiceMeshProvider, type ServiceMeshConfig } from './MCPServiceMesh';
export { KubernetesServiceMeshProvider, type KubernetesConfig } from './providers/KubernetesServiceMeshProvider';
export { ServiceMeshMonitor, type ServiceMeshMonitorConfig, type ServiceMonitoringData, type Alert, type AlertStatus, type MonitoringStatistics } from './ServiceMeshMonitor';
export { ServiceMeshScaler, type ServiceMeshScalerConfig, type ScalingDecision, type ServiceScalingState, type ScalingStatistics } from './ServiceMeshScaler';
export { WorkflowExecutionMonitor, type ExecutionMetrics, type ExecutionEvent, type ExecutionHistoryEntry, type AlertConfig, type AlertEvent } from './WorkflowExecutionMonitor';
export { MCPCallbackHandler, type CallbackHandlerConfig, type CallbackRegistration, type CallbackQueueEntry, type CallbackProcessingResult, type CallbackStatistics } from './MCPCallbackHandler';
import { PlatformTypesBridge, PlatformUtils } from './platform-types';
import { RelayIntegration, RelayIntegrationFactory } from './relay-core';
import { DatabaseIntegration, DatabaseIntegrationFactory } from './database';
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
export { PlatformTypesBridge, PlatformUtils, RelayIntegration, RelayIntegrationFactory, DatabaseIntegration, DatabaseIntegrationFactory };
export default PlatformIntegrationManager;
//# sourceMappingURL=index.d.ts.map