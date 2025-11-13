/**
 * MCP Integration bridges and Platform Integrations
 *
 * This module provides integration bridges for connecting MCP core
 * with other platform components and The New Fuse ecosystem.
 */
// Legacy relay bridge (deprecated - use relay-core integration)
export { RelayBridge, createRelayBridge, replaceMCPTransport } from './RelayBridge';
// Theia IDE integration bridge
export { TheiaMCPBridge, createTheiaMCPBridge } from './TheiaMCPBridge';
// MCP System Factory and related exports
export { MCPSystemFactory } from '../factory/MCPSystemFactory';
// Platform integrations (new)
export * from './platform-types';
export * from './relay-core';
export * from './database';
// Workflow integration
export { MCPWorkflowIntegration } from './MCPWorkflowIntegration';
// Agent integration
export { MCPAgentIntegration } from './MCPAgentIntegration';
// Service mesh integration
export { MCPServiceMesh } from './MCPServiceMesh';
export { KubernetesServiceMeshProvider } from './providers/KubernetesServiceMeshProvider';
export { ServiceMeshMonitor } from './ServiceMeshMonitor';
export { ServiceMeshScaler } from './ServiceMeshScaler';
export { WorkflowExecutionMonitor } from './WorkflowExecutionMonitor';
export { MCPCallbackHandler } from './MCPCallbackHandler';
// Platform integration manager
import { PlatformTypesBridge, PlatformUtils } from './platform-types';
import { RelayIntegration, RelayIntegrationFactory } from './relay-core';
import { DatabaseIntegration, DatabaseIntegrationFactory } from './database';
/**
 * Platform Integration Manager
 * Orchestrates all platform integrations for MCP Core
 */
export class PlatformIntegrationManager {
    static instance;
    initialized = false;
    integrations = {
        platformTypes: PlatformTypesBridge,
        relayCore: RelayIntegration,
        database: DatabaseIntegration
    };
    config = {
        platformTypes: { enabled: true },
        relayCore: { enabled: true, autoRegister: true },
        database: { enabled: true, enableMetrics: true, enableAuditLog: true }
    };
    constructor() { }
    static getInstance() {
        if (!PlatformIntegrationManager.instance) {
            PlatformIntegrationManager.instance = new PlatformIntegrationManager();
        }
        return PlatformIntegrationManager.instance;
    }
    /**
     * Initialize all platform integrations
     */
    async initialize(config) {
        if (this.initialized) {
            return {
                success: true,
                integrations: {
                    platformTypes: this.integrations.platformTypes.isAvailable,
                    relayCore: this.integrations.relayCore.isAvailable,
                    database: this.integrations.database.isAvailable
                },
                errors: []
            };
        }
        const errors = [];
        const integrationStatus = {
            platformTypes: false,
            relayCore: false,
            database: false
        };
        try {
            // Initialize platform types integration
            if (this.config.platformTypes.enabled) {
                const validation = PlatformUtils.validateCompatibility();
                if (validation.compatible) {
                    integrationStatus.platformTypes = true;
                }
                else {
                    errors.push(`Platform types compatibility issues: ${validation.issues.join(', ')}`);
                }
            }
            // Initialize relay core integration
            if (this.config.relayCore.enabled && this.integrations.relayCore.isAvailable) {
                const relayFactory = RelayIntegrationFactory.create(config?.relayCore);
                const initialized = await relayFactory.initialize();
                integrationStatus.relayCore = initialized;
                if (!initialized) {
                    errors.push('Failed to initialize relay core integration');
                }
            }
            // Initialize database integration
            if (this.config.database.enabled && this.integrations.database.isAvailable) {
                const dbFactory = await DatabaseIntegrationFactory.create(config?.database);
                integrationStatus.database = dbFactory.isInitialized;
                if (!dbFactory.isInitialized) {
                    errors.push('Failed to initialize database integration');
                }
            }
            this.initialized = true;
            return {
                success: errors.length === 0,
                integrations: integrationStatus,
                errors
            };
        }
        catch (error) {
            errors.push(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                integrations: integrationStatus,
                errors
            };
        }
    }
    /**
     * Register MCP service with all available integrations
     */
    async registerService(serviceInfo) {
        const errors = [];
        const results = {
            platformTypes: false,
            relayCore: false,
            database: false
        };
        try {
            // Register with platform types (convert to agent format)
            if (this.integrations.platformTypes.isAvailable) {
                try {
                    const agentInfo = this.integrations.platformTypes.mapServiceToAgent(serviceInfo);
                    results.platformTypes = !!agentInfo;
                }
                catch (error) {
                    errors.push(`Platform types registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            // Register with relay core
            if (this.integrations.relayCore.isAvailable) {
                try {
                    const registered = await this.integrations.relayCore.registerMCPService(serviceInfo, this.config.relayCore);
                    results.relayCore = registered;
                    if (!registered) {
                        errors.push('Relay core registration returned false');
                    }
                }
                catch (error) {
                    errors.push(`Relay core registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            // Register with database
            if (this.integrations.database.isAvailable) {
                try {
                    const saved = await this.integrations.database.saveServiceInfo(serviceInfo);
                    results.database = !!saved;
                    if (!saved) {
                        errors.push('Database registration returned null');
                    }
                }
                catch (error) {
                    errors.push(`Database registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return {
                success: errors.length === 0 || Object.values(results).some(Boolean),
                results,
                errors
            };
        }
        catch (error) {
            errors.push(`Service registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                results,
                errors
            };
        }
    }
    /**
     * Get integration status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            integrations: {
                platformTypes: {
                    available: this.integrations.platformTypes.isAvailable,
                    enabled: this.config.platformTypes.enabled
                },
                relayCore: {
                    available: this.integrations.relayCore.isAvailable,
                    enabled: this.config.relayCore.enabled
                },
                database: {
                    available: this.integrations.database.isAvailable,
                    enabled: this.config.database.enabled
                }
            },
            config: this.config
        };
    }
    /**
     * Check if running in platform environment
     */
    isPlatformEnvironment() {
        return PlatformUtils.isPlatformEnvironment();
    }
}
/**
 * Global platform integration instance
 */
export const platformIntegration = PlatformIntegrationManager.getInstance();
/**
 * Convenience functions for common integration tasks
 */
export const IntegrationUtils = {
    /**
     * Initialize all integrations with default configuration
     */
    async initializeAll(config) {
        return await platformIntegration.initialize(config);
    },
    /**
     * Register service with automatic platform integration
     */
    async registerService(serviceInfo) {
        return await platformIntegration.registerService(serviceInfo);
    },
    /**
     * Get current integration status
     */
    getIntegrationStatus() {
        return platformIntegration.getStatus();
    }
};
// Export individual integrations for direct access
export { PlatformTypesBridge, PlatformUtils, RelayIntegration, RelayIntegrationFactory, DatabaseIntegration, DatabaseIntegrationFactory };
export default PlatformIntegrationManager;
//# sourceMappingURL=index.js.map