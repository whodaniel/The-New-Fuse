/**
 * MCP Service Mesh Integration Implementation
 * 
 * This class provides integration between MCP services and service mesh infrastructure
 * for service discovery, load balancing, health monitoring, and automatic scaling.
 */

import { EventEmitter } from 'events';
import {
  IMCPServiceMesh,
  ServiceMeshRegistration,
  ServiceMeshQuery,
  ServiceMeshMetrics,
  ServiceScalingConfig,
  ServiceMeshIntegrationResult,
  AutoDiscoveryConfig,
  ServiceMeshIntegrationStatus,
  ScalingEvent,
  ServiceMeshHealthCheck,
  ServiceMeshLoadBalancing
} from '../interfaces/IMCPServiceMesh';
import { MCPServiceInfo, ServiceHealth } from '../types/broker';
import { MCPErrorClass as MCPError, MCPErrorCode } from '../types/error';

// Re-export types for other modules
export type {
  ServiceMeshRegistration,
  ServiceMeshQuery,
  ServiceMeshMetrics,
  ServiceScalingConfig,
  ServiceMeshIntegrationResult,
  ScalingEvent,
  ScalingPolicy
} from '../interfaces/IMCPServiceMesh';

/**
 * Service mesh provider interface for different mesh implementations
 */
export interface ServiceMeshProvider {
  /** Provider name */
  name: string;
  /** Provider version */
  version: string;
  /** Register service with the mesh */
  registerService(registration: ServiceMeshRegistration): Promise<string>;
  /** Unregister service from the mesh */
  unregisterService(serviceId: string): Promise<void>;
  /** Discover services in the mesh */
  discoverServices(query: ServiceMeshQuery): Promise<ServiceMeshRegistration[]>;
  /** Get service health */
  getServiceHealth(serviceId: string): Promise<ServiceHealth>;
  /** Update service health */
  updateServiceHealth(serviceId: string, health: ServiceHealth): Promise<void>;
  /** Get service metrics */
  getServiceMetrics(serviceId: string): Promise<ServiceMeshMetrics>;
  /** Configure service scaling */
  configureScaling(serviceId: string, config: ServiceScalingConfig): Promise<void>;
  /** Get scaling status */
  getScalingStatus(serviceId: string): Promise<{
    currentInstances: number;
    desiredInstances: number;
    scalingEvents: ScalingEvent[];
  }>;
  /** Check if provider is available */
  isAvailable(): Promise<boolean>;
}

/**
 * Service mesh configuration
 */
export interface ServiceMeshConfig {
  /** Service mesh provider */
  provider: ServiceMeshProvider;
  /** Auto discovery configuration */
  autoDiscovery?: AutoDiscoveryConfig;
  /** Health monitoring configuration */
  healthMonitoring?: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
  /** Metrics collection configuration */
  metricsCollection?: {
    enabled: boolean;
    interval: number;
    retention: number;
  };
  /** Scaling configuration */
  scaling?: {
    enabled: boolean;
    defaultConfig: Partial<ServiceScalingConfig>;
  };
}

/**
 * MCP Service Mesh Integration implementation
 */
export class MCPServiceMesh extends EventEmitter implements IMCPServiceMesh {
  private provider: ServiceMeshProvider;
  private config: ServiceMeshConfig;
  private registeredServices: Map<string, ServiceMeshRegistration> = new Map();
  private healthMonitorInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  private autoDiscoveryEnabled = false;
  private integrationStatus: ServiceMeshIntegrationStatus;

  constructor(config: ServiceMeshConfig) {
    super();
    this.provider = config.provider;
    this.config = config;
    this.integrationStatus = this.initializeStatus();
    this.setupEventHandlers();
  }

  /**
   * Initialize integration status
   */
  private initializeStatus(): ServiceMeshIntegrationStatus {
    return {
      enabled: true,
      meshType: this.provider.name,
      connectedServices: 0,
      health: 'healthy',
      lastSync: new Date(),
      metrics: {
        totalRegistrations: 0,
        failedRegistrations: 0,
        activeHealthChecks: 0,
        recentScalingEvents: 0
      },
      config: {
        autoDiscoveryEnabled: this.config.autoDiscovery?.autoRegister ?? false,
        healthMonitoringEnabled: this.config.healthMonitoring?.enabled ?? false,
        scalingEnabled: this.config.scaling?.enabled ?? false
      }
    };
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    this.on('service-registered', (serviceId: string) => {
      this.integrationStatus.connectedServices++;
      this.integrationStatus.metrics.totalRegistrations++;
      this.integrationStatus.lastSync = new Date();
    });

    this.on('service-unregistered', (serviceId: string) => {
      this.integrationStatus.connectedServices--;
      this.integrationStatus.lastSync = new Date();
    });

    this.on('registration-failed', (error: any) => {
      this.integrationStatus.metrics.failedRegistrations++;
      this.integrationStatus.health = 'degraded';
    });

    this.on('scaling-event', (event: ScalingEvent) => {
      this.integrationStatus.metrics.recentScalingEvents++;
    });
  }

  /**
   * Register an MCP service with the service mesh
   */
  async registerService(
    mcpService: MCPServiceInfo,
    meshConfig: ServiceMeshRegistration
  ): Promise<ServiceMeshIntegrationResult> {
    try {
      // Validate provider availability
      if (!(await this.provider.isAvailable())) {
        throw new MCPError(
          MCPErrorCode.SERVICE_UNAVAILABLE,
          'Service mesh provider is not available'
        );
      }

      // Enhance mesh configuration with MCP service information
      const enhancedConfig: ServiceMeshRegistration = {
        ...meshConfig,
        serviceId: mcpService.id,
        serviceName: mcpService.name,
        version: mcpService.version,
        metadata: {
          ...meshConfig.metadata,
          mcpCapabilities: mcpService.capabilities,
          mcpResources: mcpService.resources.map(r => r.name),
          mcpTools: mcpService.tools.map(t => t.name),
          mcpStatus: mcpService.status,
          registeredAt: mcpService.registeredAt.toISOString(),
          lastHeartbeat: mcpService.lastHeartbeat.toISOString()
        },
        tags: [
          ...meshConfig.tags,
          'mcp-service',
          `mcp-version-${mcpService.version}`,
          ...mcpService.capabilities.map(cap => `capability-${cap}`)
        ]
      };

      // Register with the service mesh provider
      const meshServiceId = await this.provider.registerService(enhancedConfig);

      // Store registration information
      this.registeredServices.set(mcpService.id, enhancedConfig);

      // Start health monitoring if enabled
      if (this.config.healthMonitoring?.enabled) {
        this.startHealthMonitoring(mcpService.id);
      }

      // Configure scaling if enabled
      if (this.config.scaling?.enabled && this.config.scaling.defaultConfig) {
        await this.configureScaling(mcpService.id, {
          minInstances: 1,
          maxInstances: 10,
          scaleUpCooldown: 300,
          scaleDownCooldown: 600,
          ...this.config.scaling.defaultConfig
        });
      }

      this.emit('service-registered', mcpService.id);

      return {
        success: true,
        meshServiceId,
        message: `Service ${mcpService.name} successfully registered with service mesh`,
        metadata: {
          meshServiceId,
          registrationTime: new Date().toISOString(),
          providerName: this.provider.name
        }
      };

    } catch (error) {
      this.emit('registration-failed', error);
      
      return {
        success: false,
        message: `Failed to register service ${mcpService.name} with service mesh`,
        error: {
          code: error instanceof MCPError ? error.code.toString() : 'REGISTRATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Unregister an MCP service from the service mesh
   */
  async unregisterService(serviceId: string): Promise<ServiceMeshIntegrationResult> {
    try {
      // Check if service is registered
      if (!this.registeredServices.has(serviceId)) {
        throw new MCPError(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service ${serviceId} is not registered with service mesh`
        );
      }

      // Unregister from the service mesh provider
      await this.provider.unregisterService(serviceId);

      // Remove from local registry
      const registration = this.registeredServices.get(serviceId);
      this.registeredServices.delete(serviceId);

      // Stop health monitoring
      this.stopHealthMonitoring(serviceId);

      this.emit('service-unregistered', serviceId);

      return {
        success: true,
        message: `Service ${registration?.serviceName || serviceId} successfully unregistered from service mesh`,
        metadata: {
          unregistrationTime: new Date().toISOString(),
          providerName: this.provider.name
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to unregister service ${serviceId} from service mesh`,
        error: {
          code: error instanceof MCPError ? error.code.toString() : 'UNREGISTRATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Discover services in the service mesh
   */
  async discoverServices(query: ServiceMeshQuery): Promise<ServiceMeshRegistration[]> {
    try {
      // Add MCP-specific filters
      const enhancedQuery: ServiceMeshQuery = {
        ...query,
        tags: [
          ...(query.tags || []),
          'mcp-service'
        ]
      };

      return await this.provider.discoverServices(enhancedQuery);
    } catch (error) {
      throw new MCPError(
        MCPErrorCode.INTERNAL_ERROR,
        `Failed to discover services: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get service health from the service mesh
   */
  async getServiceHealth(serviceId: string): Promise<ServiceHealth> {
    try {
      return await this.provider.getServiceHealth(serviceId);
    } catch (error) {
      throw new MCPError(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Failed to get health for service ${serviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update service health status in the service mesh
   */
  async updateServiceHealth(
    serviceId: string,
    health: ServiceHealth
  ): Promise<ServiceMeshIntegrationResult> {
    try {
      await this.provider.updateServiceHealth(serviceId, health);

      return {
        success: true,
        message: `Health status updated for service ${serviceId}`,
        metadata: {
          updateTime: new Date().toISOString(),
          healthStatus: health.status,
          healthScore: health.score
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update health for service ${serviceId}`,
        error: {
          code: 'HEALTH_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Get service metrics from the service mesh
   */
  async getServiceMetrics(serviceId: string): Promise<ServiceMeshMetrics> {
    try {
      return await this.provider.getServiceMetrics(serviceId);
    } catch (error) {
      throw new MCPError(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Failed to get metrics for service ${serviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Configure service scaling
   */
  async configureScaling(
    serviceId: string,
    scalingConfig: ServiceScalingConfig
  ): Promise<ServiceMeshIntegrationResult> {
    try {
      await this.provider.configureScaling(serviceId, scalingConfig);

      return {
        success: true,
        message: `Scaling configured for service ${serviceId}`,
        metadata: {
          configurationTime: new Date().toISOString(),
          minInstances: scalingConfig.minInstances,
          maxInstances: scalingConfig.maxInstances,
          policies: scalingConfig.policies?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to configure scaling for service ${serviceId}`,
        error: {
          code: 'SCALING_CONFIG_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Get current service scaling status
   */
  async getScalingStatus(serviceId: string): Promise<{
    currentInstances: number;
    desiredInstances: number;
    scalingEvents: ScalingEvent[];
  }> {
    try {
      return await this.provider.getScalingStatus(serviceId);
    } catch (error) {
      throw new MCPError(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Failed to get scaling status for service ${serviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Enable automatic service discovery integration
   */
  async enableAutoDiscovery(config: AutoDiscoveryConfig): Promise<ServiceMeshIntegrationResult> {
    try {
      this.config.autoDiscovery = config;
      this.autoDiscoveryEnabled = true;
      this.integrationStatus.config.autoDiscoveryEnabled = true;

      // Start auto-discovery monitoring if needed
      if (config.autoRegister) {
        this.startAutoDiscoveryMonitoring();
      }

      return {
        success: true,
        message: 'Auto-discovery enabled successfully',
        metadata: {
          enabledTime: new Date().toISOString(),
          autoRegister: config.autoRegister,
          autoDeregister: config.autoDeregister
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to enable auto-discovery',
        error: {
          code: 'AUTO_DISCOVERY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Disable automatic service discovery integration
   */
  async disableAutoDiscovery(): Promise<ServiceMeshIntegrationResult> {
    try {
      this.autoDiscoveryEnabled = false;
      this.integrationStatus.config.autoDiscoveryEnabled = false;
      this.stopAutoDiscoveryMonitoring();

      return {
        success: true,
        message: 'Auto-discovery disabled successfully',
        metadata: {
          disabledTime: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to disable auto-discovery',
        error: {
          code: 'AUTO_DISCOVERY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * Get service mesh integration status
   */
  async getIntegrationStatus(): Promise<ServiceMeshIntegrationStatus> {
    // Update real-time metrics
    this.integrationStatus.connectedServices = this.registeredServices.size;
    this.integrationStatus.lastSync = new Date();

    // Check provider health
    try {
      const isAvailable = await this.provider.isAvailable();
      this.integrationStatus.health = isAvailable ? 'healthy' : 'unhealthy';
    } catch (error) {
      this.integrationStatus.health = 'unhealthy';
    }

    return { ...this.integrationStatus };
  }

  /**
   * Start health monitoring for a service
   */
  private startHealthMonitoring(serviceId: string): void {
    if (!this.config.healthMonitoring?.enabled) return;

    const interval = this.config.healthMonitoring.interval * 1000;
    
    const monitor = setInterval(async () => {
      try {
        const health = await this.provider.getServiceHealth(serviceId);
        this.emit('health-check', serviceId, health);
        
        // Update integration status
        this.integrationStatus.metrics.activeHealthChecks++;
      } catch (error) {
        this.emit('health-check-failed', serviceId, error);
      }
    }, interval);

    // Store interval reference for cleanup
    this.healthMonitorInterval = monitor;
  }

  /**
   * Stop health monitoring for a service
   */
  private stopHealthMonitoring(serviceId: string): void {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = undefined;
    }
  }

  /**
   * Start auto-discovery monitoring
   */
  private startAutoDiscoveryMonitoring(): void {
    // Implementation would monitor for new MCP services and automatically register them
    // This is a placeholder for the actual implementation
  }

  /**
   * Stop auto-discovery monitoring
   */
  private stopAutoDiscoveryMonitoring(): void {
    // Implementation would stop monitoring for new MCP services
    // This is a placeholder for the actual implementation
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Stop all monitoring
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }

    // Unregister all services
    const unregistrationPromises = Array.from(this.registeredServices.keys()).map(
      serviceId => this.unregisterService(serviceId)
    );

    await Promise.allSettled(unregistrationPromises);

    // Clear local state
    this.registeredServices.clear();
    this.removeAllListeners();
  }
}