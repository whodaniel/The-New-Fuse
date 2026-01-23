/**
 * MCP Integration bridges and Platform Integrations
 *
 * This module provides integration bridges for connecting MCP core
 * with other platform components and The New Fuse ecosystem.
 */

// Legacy relay bridge (deprecated - use relay-core integration)
export {
  createRelayBridge,
  RelayBridge,
  replaceMCPTransport,
  type RelayBridgeConfig,
} from './RelayBridge';

// SkIDEancer IDE integration bridge
export {
  createSkIDEancerMCPBridge,
  SkIDEancerMCPBridge,
  type SkIDEancerMCPBridgeConfig,
} from './TheiaMCPBridge';

// MCP System Factory and related exports
export {
  MCPSystemFactory,
  type MCPSystem,
  type MCPSystemConfig,
} from '../factory/MCPSystemFactory';

// Platform integrations (new)
export * from './database';
export * from './platform-types';
export * from './relay-core';

// Workflow integration
export {
  MCPWorkflowIntegration,
  type MCPWorkflowIntegrationConfig,
} from './MCPWorkflowIntegration';

// Agent integration
export { MCPAgentIntegration, type MCPAgentIntegrationConfig } from './MCPAgentIntegration';

// Service mesh integration
export {
  MCPCallbackHandler,
  type CallbackHandlerConfig,
  type CallbackProcessingResult,
  type CallbackQueueEntry,
  type CallbackRegistration,
  type CallbackStatistics,
} from './MCPCallbackHandler';
export { MCPServiceMesh, type ServiceMeshConfig, type ServiceMeshProvider } from './MCPServiceMesh';
export {
  KubernetesServiceMeshProvider,
  type KubernetesConfig,
} from './providers/KubernetesServiceMeshProvider';
export {
  ServiceMeshMonitor,
  type Alert,
  type AlertStatus,
  type MonitoringStatistics,
  type ServiceMeshMonitorConfig,
  type ServiceMonitoringData,
} from './ServiceMeshMonitor';
export {
  ServiceMeshScaler,
  type ScalingDecision,
  type ScalingStatistics,
  type ServiceMeshScalerConfig,
  type ServiceScalingState,
} from './ServiceMeshScaler';
export {
  WorkflowExecutionMonitor,
  type AlertConfig,
  type AlertEvent,
  type ExecutionEvent,
  type ExecutionHistoryEntry,
  type ExecutionMetrics,
} from './WorkflowExecutionMonitor';

// Platform integration manager
import { DatabaseIntegration, DatabaseIntegrationFactory } from './database';
import { PlatformTypesBridge, PlatformUtils } from './platform-types';
import { RelayIntegration, RelayIntegrationFactory } from './relay-core';

/**
 * Platform Integration Manager
 * Orchestrates all platform integrations for MCP Core
 */
export class PlatformIntegrationManager {
  private static instance: PlatformIntegrationManager;
  private initialized = false;
  private integrations = {
    platformTypes: PlatformTypesBridge,
    relayCore: RelayIntegration,
    database: DatabaseIntegration,
  };

  private config = {
    platformTypes: { enabled: true },
    relayCore: { enabled: true, autoRegister: true },
    database: { enabled: true, enableMetrics: true, enableAuditLog: true },
  };

  private constructor() {}

  static getInstance(): PlatformIntegrationManager {
    if (!PlatformIntegrationManager.instance) {
      PlatformIntegrationManager.instance = new PlatformIntegrationManager();
    }
    return PlatformIntegrationManager.instance;
  }

  /**
   * Initialize all platform integrations
   */
  async initialize(config?: any): Promise<{
    success: boolean;
    integrations: {
      platformTypes: boolean;
      relayCore: boolean;
      database: boolean;
    };
    errors: string[];
  }> {
    if (this.initialized) {
      return {
        success: true,
        integrations: {
          platformTypes: this.integrations.platformTypes.isAvailable,
          relayCore: this.integrations.relayCore.isAvailable,
          database: this.integrations.database.isAvailable,
        },
        errors: [],
      };
    }

    const errors: string[] = [];
    const integrationStatus = {
      platformTypes: false,
      relayCore: false,
      database: false,
    };

    try {
      // Initialize platform types integration
      if (this.config.platformTypes.enabled) {
        const validation = PlatformUtils.validateCompatibility();
        if (validation.compatible) {
          integrationStatus.platformTypes = true;
        } else {
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
        errors,
      };
    } catch (error) {
      errors.push(
        `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      return {
        success: false,
        integrations: integrationStatus,
        errors,
      };
    }
  }

  /**
   * Register MCP service with all available integrations
   */
  async registerService(serviceInfo: any): Promise<{
    success: boolean;
    results: {
      platformTypes: boolean;
      relayCore: boolean;
      database: boolean;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const results = {
      platformTypes: false,
      relayCore: false,
      database: false,
    };

    try {
      // Register with platform types (convert to agent format)
      if (this.integrations.platformTypes.isAvailable) {
        try {
          const agentInfo = this.integrations.platformTypes.mapServiceToAgent(serviceInfo);
          results.platformTypes = !!agentInfo;
        } catch (error) {
          errors.push(
            `Platform types registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Register with relay core
      if (this.integrations.relayCore.isAvailable) {
        try {
          const registered = await this.integrations.relayCore.registerMCPService(
            serviceInfo,
            this.config.relayCore
          );
          results.relayCore = registered;

          if (!registered) {
            errors.push('Relay core registration returned false');
          }
        } catch (error) {
          errors.push(
            `Relay core registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
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
        } catch (error) {
          errors.push(
            `Database registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return {
        success: errors.length === 0 || Object.values(results).some(Boolean),
        results,
        errors,
      };
    } catch (error) {
      errors.push(
        `Service registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      return {
        success: false,
        results,
        errors,
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
          enabled: this.config.platformTypes.enabled,
        },
        relayCore: {
          available: this.integrations.relayCore.isAvailable,
          enabled: this.config.relayCore.enabled,
        },
        database: {
          available: this.integrations.database.isAvailable,
          enabled: this.config.database.enabled,
        },
      },
      config: this.config,
    };
  }

  /**
   * Check if running in platform environment
   */
  isPlatformEnvironment(): boolean {
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
  async initializeAll(config?: any) {
    return await platformIntegration.initialize(config);
  },

  /**
   * Register service with automatic platform integration
   */
  async registerService(serviceInfo: any) {
    return await platformIntegration.registerService(serviceInfo);
  },

  /**
   * Get current integration status
   */
  getIntegrationStatus() {
    return platformIntegration.getStatus();
  },
};

// Export individual integrations for direct access
export {
  DatabaseIntegration,
  DatabaseIntegrationFactory,
  PlatformTypesBridge,
  PlatformUtils,
  RelayIntegration,
  RelayIntegrationFactory,
};

export default PlatformIntegrationManager;
