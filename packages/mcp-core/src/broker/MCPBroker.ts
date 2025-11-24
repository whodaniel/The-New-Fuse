/**
 * MCP Broker Implementation
 *
 * This module implements the core MCP broker functionality including service registry,
 * discovery, health monitoring, and automatic cleanup capabilities.
 */

import { EventEmitter } from 'events';
import { IMCPBroker } from '../interfaces/IMCPBroker';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage';
import {
  MCPServiceInfo,
  ServiceQuery,
  ServiceHealth,
  BrokerConfig,
  RoutingMetrics,
  LoadBalancingStrategy,
  ServiceCompatibilityResult,
  RoutingInfo
} from '../types';
import { ServiceStatus } from '../types/common';
import { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode } from '../types/error';
import { ServiceRegistry } from './ServiceRegistry';
import { HealthMonitor } from './HealthMonitor';
import { MessageRouter } from './MessageRouter';
import { LoadBalancer } from './LoadBalancer';
import { EventSubscriptionManager, PatternType } from './EventSubscriptionManager';

/**
 * Default broker configuration
 */
const DEFAULT_BROKER_CONFIG: BrokerConfig = {
  name: 'mcp-broker',
  version: '1.0.0',
  registry: {
    type: 'memory',
    serviceTTL: 300, // 5 minutes
    cleanupInterval: 60 // 1 minute
  },
  loadBalancing: {
    defaultStrategy: LoadBalancingStrategy.ROUND_ROBIN,
    useHealthCheck: true,
    stickySession: false
  },
  healthCheck: {
    interval: 30, // 30 seconds
    timeout: 5000, // 5 seconds
    failureThreshold: 3,
    recoveryThreshold: 2,
    enabled: true
  },
  options: {
    enableMetrics: true,
    metricsInterval: 60,
    enableDiscoveryCache: true,
    discoveryCacheTTL: 300,
    maxConcurrentRequests: 1000
  }
};

/**
 * MCPBroker class implementing the IMCPBroker interface
 *
 * Provides comprehensive service registry, discovery, health monitoring,
 * and message routing capabilities for MCP services.
 */
export class MCPBroker extends EventEmitter implements IMCPBroker {
  private config: BrokerConfig;
  private serviceRegistry: ServiceRegistry;
  private healthMonitor: HealthMonitor;
  private messageRouter: MessageRouter;
  private loadBalancer: LoadBalancer;
  private eventSubscriptionManager: EventSubscriptionManager;
  private isRunningFlag: boolean = false;
  private cleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private startTime: Date = new Date();

  constructor(config?: Partial<BrokerConfig>) {
    super();
    this.config = this.mergeConfig(config);
    this.serviceRegistry = new ServiceRegistry(this.config.registry);
    this.healthMonitor = new HealthMonitor(this.config.healthCheck);
    this.loadBalancer = new LoadBalancer(this.config.loadBalancing);
    this.eventSubscriptionManager = new EventSubscriptionManager();
    this.messageRouter = new MessageRouter(this.loadBalancer, this.eventSubscriptionManager);

    this.setupEventHandlers();
  }

  /**
   * Start the broker service
   */
  async start(): Promise<void> {
    if (this.isRunningFlag) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        'Broker is already running'
      );
    }

    try {
      // Start core components
      await this.serviceRegistry.start();
      await this.healthMonitor.start();
      await this.messageRouter.start();

      // Start periodic tasks
      this.startCleanupTask();
      if (this.config.options?.enableMetrics) {
        this.startMetricsCollection();
      }

      this.isRunningFlag = true;
      this.emit('started');
    } catch (error) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to start broker: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stop the broker service
   */
  async stop(): Promise<void> {
    if (!this.isRunningFlag) {
      return;
    }

    try {
      // Stop periodic tasks
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
      }
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = undefined;
      }

      // Stop core components
      await this.messageRouter.stop();
      await this.healthMonitor.stop();
      await this.serviceRegistry.stop();

      this.isRunningFlag = false;
      this.emit('stopped');
    } catch (error) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to stop broker: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if the broker is running
   */
  isRunning(): boolean {
    return this.isRunningFlag;
  }

  /**
   * Register a service with the broker
   */
  async registerService(service: MCPServiceInfo): Promise<void> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      // Validate service information
      this.validateServiceInfo(service);

      // Register with service registry
      await this.serviceRegistry.register(service);

      // Start health monitoring if enabled
      if (this.config.healthCheck.enabled) {
        await this.healthMonitor.addService(service.id, service.endpoint);
      }

      // Update load balancer
      this.loadBalancer.addService(service);

      this.emit('serviceRegistered', service);
    } catch (error) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to register service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Unregister a service from the broker
   */
  async unregisterService(serviceId: string): Promise<void> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const service = await this.serviceRegistry.get(serviceId);
      if (!service) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service not found: ${serviceId}`
        );
      }

      // Remove from health monitoring
      if (this.config.healthCheck.enabled) {
        await this.healthMonitor.removeService(serviceId);
      }

      // Remove from load balancer
      this.loadBalancer.removeService(serviceId);

      // Clean up event subscriptions
      await this.messageRouter.unsubscribeService(serviceId);

      // Unregister from service registry
      await this.serviceRegistry.unregister(serviceId);

      this.emit('serviceUnregistered', service);
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to unregister service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Discover services based on query criteria
   */
  async discoverServices(query: ServiceQuery): Promise<MCPServiceInfo[]> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const services = await this.serviceRegistry.discover(query);

      // Filter by health status if health checking is enabled
      if (this.config.healthCheck.enabled && this.config.loadBalancing.useHealthCheck) {
        const healthyServices: MCPServiceInfo[] = [];
        for (const service of services) {
          const health = await this.healthMonitor.getServiceHealth(service.id);
          if (health && health.status === ServiceStatus.ONLINE) {
            healthyServices.push(service);
          }
        }
        return healthyServices;
      }

      return services;
    } catch (error) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to discover services: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Advanced service discovery with capability matching
   */
  async discoverServicesAdvanced(query: ServiceQuery & {
    requiredCapabilities?: string[];
    compatibleWith?: string;
    minHealthScore?: number;
    maxAge?: number;
  }): Promise<MCPServiceInfo[]> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const services = await this.serviceRegistry.discoverWithCapabilityMatching(query);

      // Filter by health status if health checking is enabled
      if (this.config.healthCheck.enabled && this.config.loadBalancing.useHealthCheck) {
        const healthyServices: MCPServiceInfo[] = [];
        for (const service of services) {
          const health = await this.healthMonitor.getServiceHealth(service.id);
          if (health && health.status === ServiceStatus.ONLINE) {
            healthyServices.push(service);
          }
        }
        return healthyServices;
      }

      return services;
    } catch (error) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to discover services with advanced criteria: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find services compatible with a given service
   */
  async findCompatibleServices(serviceId: string): Promise<MCPServiceInfo[]> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const targetService = await this.serviceRegistry.get(serviceId);
      if (!targetService) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service not found: ${serviceId}`
        );
      }

      return await this.serviceRegistry.findCompatibleServices(targetService);
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to find compatible services: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get service recommendations
   */
  async getServiceRecommendations(
    serviceId: string,
    options: {
      maxRecommendations?: number;
      includeCompatible?: boolean;
      includeSimilar?: boolean;
      weightByHealth?: boolean;
    } = {}
  ): Promise<MCPServiceInfo[]> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const targetService = await this.serviceRegistry.get(serviceId);
      if (!targetService) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service not found: ${serviceId}`
        );
      }

      return await this.serviceRegistry.getServiceRecommendations(targetService, options);
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to get service recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check capability compatibility between two services
   */
  async checkServiceCompatibility(serviceIdA: string, serviceIdB: string): Promise<ServiceCompatibilityResult> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const serviceA = await this.serviceRegistry.get(serviceIdA);
      const serviceB = await this.serviceRegistry.get(serviceIdB);

      if (!serviceA) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service not found: ${serviceIdA}`
        );
      }

      if (!serviceB) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service not found: ${serviceIdB}`
        );
      }

      const result = this.serviceRegistry.checkCapabilityCompatibility(serviceA, serviceB);
      // Add compatibility score calculation
      const compatibilityScore = result.commonCapabilities.length /
        Math.max(serviceA.capabilities.length, serviceB.capabilities.length, 1);

      return {
        ...result,
        compatibilityScore
      };
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to check service compatibility: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Route a request to an appropriate service
   */
  async routeRequest(request: MCPRequest, targetService?: string): Promise<MCPResponse> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const routingInfo: RoutingInfo | undefined = targetService ? { targetService } : undefined;
      return await this.messageRouter.routeRequest(request, routingInfo);
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to route request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get health status of a specific service
   */
  async getServiceHealth(serviceId: string): Promise<ServiceHealth> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    if (!this.config.healthCheck.enabled) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.METHOD_NOT_FOUND,
        'Health checking is disabled'
      );
    }

    try {
      const health = await this.healthMonitor.getServiceHealth(serviceId);
      if (!health) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Health information not found for service: ${serviceId}`
        );
      }
      return health;
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to get service health: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all registered services
   */
  async getAllServices(): Promise<MCPServiceInfo[]> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      return await this.serviceRegistry.getAll();
    } catch (error) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to get all services: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update service information
   */
  async updateService(serviceId: string, updates: Partial<MCPServiceInfo>): Promise<void> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      const existingService = await this.serviceRegistry.get(serviceId);
      if (!existingService) {
        throw new MCPErrorClass(
          MCPErrorCode.RESOURCE_NOT_FOUND,
          `Service not found: ${serviceId}`
        );
      }

      const updatedService = { ...existingService, ...updates };
      await this.serviceRegistry.update(serviceId, updatedService);

      // Update load balancer if service info changed
      this.loadBalancer.updateService(updatedService);

      this.emit('serviceUpdated', updatedService);
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a service is registered
   */
  async isServiceRegistered(serviceId: string): Promise<boolean> {
    if (!this.isRunningFlag) {
      return false;
    }

    try {
      const service = await this.serviceRegistry.get(serviceId);
      return service !== null;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get broker metrics
   */
  getMetrics(): RoutingMetrics {
    return this.messageRouter.getMetrics();
  }

  /**
   * Get broker configuration
   */
  getConfig(): BrokerConfig {
    return { ...this.config };
  }

  /**
   * Get broker uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Subscribe a service to events matching a pattern
   */
  async subscribeToEvents(
    serviceId: string,
    pattern: string,
    patternType: PatternType = PatternType.EXACT,
    filters?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      return await this.messageRouter.subscribeToEventsAdvanced(
        serviceId,
        pattern,
        patternType,
        filters,
        metadata
      );
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to subscribe to events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribeFromEvents(subscriptionId: string): Promise<void> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      await this.messageRouter.unsubscribeFromEvents(subscriptionId);
    } catch (error) {
      if (error instanceof MCPErrorClass) {
        throw error;
      }
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to unsubscribe from events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Route notification to subscribed services
   */
  async routeNotification(notification: MCPNotification): Promise<void> {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    try {
      await this.messageRouter.routeNotification(notification);
    } catch (error) {
      throw new MCPErrorClass(
        JSONRPCErrorCode.INTERNAL_ERROR,
        `Failed to route notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get event subscription statistics
   */
  getEventSubscriptionStatistics() {
    if (!this.isRunningFlag) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Broker is not running'
      );
    }

    return this.eventSubscriptionManager.getStatistics();
  }

  /**
   * Merge user config with default config
   */
  private mergeConfig(userConfig?: Partial<BrokerConfig>): BrokerConfig {
    if (!userConfig) {
      return { ...DEFAULT_BROKER_CONFIG };
    }

    return {
      name: userConfig.name || DEFAULT_BROKER_CONFIG.name,
      version: userConfig.version || DEFAULT_BROKER_CONFIG.version,
      registry: { ...DEFAULT_BROKER_CONFIG.registry, ...userConfig.registry },
      loadBalancing: { ...DEFAULT_BROKER_CONFIG.loadBalancing, ...userConfig.loadBalancing },
      healthCheck: { ...DEFAULT_BROKER_CONFIG.healthCheck, ...userConfig.healthCheck },
      options: { ...DEFAULT_BROKER_CONFIG.options, ...userConfig.options }
    };
  }

  /**
   * Validate service information
   */
  private validateServiceInfo(service: MCPServiceInfo): void {
    if (!service.id || typeof service.id !== 'string') {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Service ID is required and must be a string');
    }
    if (!service.name || typeof service.name !== 'string') {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Service name is required and must be a string');
    }
    if (!service.version || typeof service.version !== 'string') {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Service version is required and must be a string');
    }
    if (!service.endpoint || typeof service.endpoint !== 'string') {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Service endpoint is required and must be a string');
    }
    if (!Array.isArray(service.capabilities)) {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Service capabilities must be an array');
    }
    if (!Array.isArray(service.resources)) {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Service resources must be an array');
    }
    if (!Array.isArray(service.tools)) {
      throw new MCPErrorClass(MCPErrorCode.INVALID_PARAMS, 'Service tools must be an array');
    }
  }

  /**
   * Setup event handlers for internal components
   */
  private setupEventHandlers(): void {
    // Health monitor events
    this.healthMonitor.on('serviceHealthChanged', (serviceId: string, health: ServiceHealth) => {
      this.emit('serviceHealthChanged', serviceId, health);

      // Update service status based on health
      if (health.status === ServiceStatus.OFFLINE) {
        this.loadBalancer.markServiceUnhealthy(serviceId);
      } else if (health.status === ServiceStatus.ONLINE) {
        this.loadBalancer.markServiceHealthy(serviceId);
      }
    });

    // Service registry events
    this.serviceRegistry.on('serviceExpired', (serviceId: string) => {
      this.emit('serviceExpired', serviceId);
      this.loadBalancer.removeService(serviceId);
      if (this.config.healthCheck.enabled) {
        void this.healthMonitor.removeService(serviceId).catch(() => {
          // Silently ignore health monitor removal errors
        });
      }
    });
  }

  /**
   * Start automatic cleanup task
   */
  private startCleanupTask(): void {
    const intervalMs = this.config.registry.cleanupInterval * 1000;
    this.cleanupInterval = setInterval(() => {
      void (async () => {
        try {
          await this.serviceRegistry.cleanup();
        } catch (_error) {
          // Silently ignore cleanup errors
        }
      })();
    }, intervalMs);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (!this.config.options?.metricsInterval) {
      return;
    }

    const intervalMs = this.config.options.metricsInterval * 1000;
    this.metricsInterval = setInterval(() => {
      try {
        const metrics = this.getMetrics();
        this.emit('metricsCollected', metrics);
      } catch (_error) {
        // Silently ignore metrics collection errors
      }
    }, intervalMs);
  }
}
