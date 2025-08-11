/**
 * Service Registry Implementation
 * 
 * Manages service registration, discovery, and lifecycle with support for
 * both in-memory and persistent storage backends.
 */

import { EventEmitter } from 'events';
import { MCPServiceInfo, ServiceQuery, RegistryConfig } from '../types';
import { ServiceStatus } from '../types/common';
import { MCPErrorClass, MCPErrorCode, JSONRPCErrorCode } from '../types/error';

/**
 * Service Registry class for managing MCP service registration and discovery
 */
export class ServiceRegistry extends EventEmitter {
  private services: Map<string, MCPServiceInfo> = new Map();
  private serviceTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: RegistryConfig;
  private isStarted: boolean = false;

  constructor(config: RegistryConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the service registry
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    // Initialize storage backend based on configuration
    switch (this.config.type) {
      case 'memory':
        // In-memory storage is already initialized
        break;
      case 'redis':
      case 'etcd':
      case 'consul':
        // TODO: Implement persistent storage backends
        throw new MCPErrorClass(
          JSONRPCErrorCode.INTERNAL_ERROR,
          `Storage backend ${this.config.type} not yet implemented`
        );
      default:
        throw new MCPErrorClass(
          MCPErrorCode.INVALID_PARAMS,
          `Unknown storage backend: ${this.config.type}`
        );
    }

    this.isStarted = true;
    console.log(`Service registry started with ${this.config.type} backend`);
  }

  /**
   * Stop the service registry
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    // Clear all service timers
    for (const timer of this.serviceTimers.values()) {
      clearTimeout(timer);
    }
    this.serviceTimers.clear();

    // Clear services
    this.services.clear();

    this.isStarted = false;
    console.log('Service registry stopped');
  }

  /**
   * Register a service
   */
  async register(service: MCPServiceInfo): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Service registry is not started'
      );
    }

    // Set registration timestamp
    const serviceWithTimestamp: MCPServiceInfo = {
      ...service,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      status: service.status || ServiceStatus.ONLINE
    };

    // Store service
    this.services.set(service.id, serviceWithTimestamp);

    // Set up TTL timer if configured
    if (this.config.serviceTTL > 0) {
      this.resetServiceTimer(service.id);
    }

    this.emit('serviceRegistered', serviceWithTimestamp);
    console.log(`Service registered: ${service.name} (${service.id})`);
  }

  /**
   * Unregister a service
   */
  async unregister(serviceId: string): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Service registry is not started'
      );
    }

    const service = this.services.get(serviceId);
    if (!service) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Service not found: ${serviceId}`
      );
    }

    // Clear TTL timer
    const timer = this.serviceTimers.get(serviceId);
    if (timer) {
      clearTimeout(timer);
      this.serviceTimers.delete(serviceId);
    }

    // Remove service
    this.services.delete(serviceId);

    this.emit('serviceUnregistered', service);
    console.log(`Service unregistered: ${service.name} (${serviceId})`);
  }

  /**
   * Get a service by ID
   */
  async get(serviceId: string): Promise<MCPServiceInfo | null> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Service registry is not started'
      );
    }

    return this.services.get(serviceId) || null;
  }

  /**
   * Get all registered services
   */
  async getAll(): Promise<MCPServiceInfo[]> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Service registry is not started'
      );
    }

    return Array.from(this.services.values());
  }

  /**
   * Update a service
   */
  async update(serviceId: string, service: MCPServiceInfo): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Service registry is not started'
      );
    }

    if (!this.services.has(serviceId)) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Service not found: ${serviceId}`
      );
    }

    // Update service with new heartbeat timestamp
    const updatedService: MCPServiceInfo = {
      ...service,
      lastHeartbeat: new Date()
    };

    this.services.set(serviceId, updatedService);

    // Reset TTL timer
    if (this.config.serviceTTL > 0) {
      this.resetServiceTimer(serviceId);
    }

    this.emit('serviceUpdated', updatedService);
  }

  /**
   * Discover services based on query criteria
   */
  async discover(query: ServiceQuery): Promise<MCPServiceInfo[]> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Service registry is not started'
      );
    }

    let services = Array.from(this.services.values());

    // Apply filters
    if (query.name) {
      services = services.filter(service => 
        service.name.toLowerCase().includes(query.name!.toLowerCase())
      );
    }

    if (query.capability) {
      services = services.filter(service =>
        service.capabilities.includes(query.capability!)
      );
    }

    if (query.resource) {
      services = services.filter(service =>
        service.resources.some(resource => 
          resource.name.toLowerCase().includes(query.resource!.toLowerCase()) ||
          resource.uri.toLowerCase().includes(query.resource!.toLowerCase())
        )
      );
    }

    if (query.tool) {
      services = services.filter(service =>
        service.tools.some(tool => 
          tool.name.toLowerCase().includes(query.tool!.toLowerCase())
        )
      );
    }

    if (query.status) {
      services = services.filter(service => service.status === query.status);
    }

    if (query.tags && query.tags.length > 0) {
      services = services.filter(service =>
        service.tags && query.tags!.some(tag => service.tags!.includes(tag))
      );
    }

    // Apply generic filters if provided
    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
        services = this.applyGenericFilter(services, filter);
      }
    }

    // Apply sorting if provided
    if (query.sort && query.sort.length > 0) {
      services = this.applySorting(services, query.sort);
    }

    // Apply pagination if provided
    if (query.pagination) {
      const { limit, offset } = query.pagination;
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      services = services.slice(start, end);
    }

    return services;
  }

  /**
   * Update service heartbeat
   */
  async heartbeat(serviceId: string): Promise<void> {
    if (!this.isStarted) {
      throw new MCPErrorClass(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Service registry is not started'
      );
    }

    const service = this.services.get(serviceId);
    if (!service) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Service not found: ${serviceId}`
      );
    }

    // Update heartbeat timestamp
    service.lastHeartbeat = new Date();
    this.services.set(serviceId, service);

    // Reset TTL timer
    if (this.config.serviceTTL > 0) {
      this.resetServiceTimer(serviceId);
    }

    this.emit('serviceHeartbeat', service);
  }

  /**
   * Cleanup expired services
   */
  async cleanup(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    const now = new Date();
    const expiredServices: string[] = [];

    for (const [serviceId, service] of this.services.entries()) {
      const timeSinceHeartbeat = now.getTime() - service.lastHeartbeat.getTime();
      const ttlMs = this.config.serviceTTL * 1000;

      if (ttlMs > 0 && timeSinceHeartbeat > ttlMs) {
        expiredServices.push(serviceId);
      }
    }

    // Remove expired services
    for (const serviceId of expiredServices) {
      const service = this.services.get(serviceId);
      if (service) {
        await this.unregister(serviceId);
        this.emit('serviceExpired', serviceId, service);
        console.log(`Service expired: ${service.name} (${serviceId})`);
      }
    }

    if (expiredServices.length > 0) {
      console.log(`Cleaned up ${expiredServices.length} expired services`);
    }
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const services = Array.from(this.services.values());
    const statusCounts = services.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {} as Record<ServiceStatus, number>);

    return {
      totalServices: services.length,
      statusCounts,
      oldestService: services.reduce((oldest, service) => 
        !oldest || service.registeredAt < oldest.registeredAt ? service : oldest, 
        null as MCPServiceInfo | null
      ),
      newestService: services.reduce((newest, service) => 
        !newest || service.registeredAt > newest.registeredAt ? service : newest, 
        null as MCPServiceInfo | null
      )
    };
  }

  /**
   * Reset service TTL timer
   */
  private resetServiceTimer(serviceId: string): void {
    // Clear existing timer
    const existingTimer = this.serviceTimers.get(serviceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const ttlMs = this.config.serviceTTL * 1000;
    const timer = setTimeout(async () => {
      try {
        const service = this.services.get(serviceId);
        if (service) {
          await this.unregister(serviceId);
          this.emit('serviceExpired', serviceId, service);
          console.log(`Service expired due to TTL: ${service.name} (${serviceId})`);
        }
      } catch (error) {
        console.error(`Error expiring service ${serviceId}:`, error);
      }
    }, ttlMs);

    this.serviceTimers.set(serviceId, timer);
  }

  /**
   * Apply generic filter to services
   */
  private applyGenericFilter(services: MCPServiceInfo[], filter: any): MCPServiceInfo[] {
    const { field, operator, value } = filter;
    
    return services.filter(service => {
      let fieldValue: any;
      
      // Get field value from service
      switch (field) {
        case 'name':
          fieldValue = service.name;
          break;
        case 'version':
          fieldValue = service.version;
          break;
        case 'endpoint':
          fieldValue = service.endpoint;
          break;
        case 'status':
          fieldValue = service.status;
          break;
        case 'healthScore':
          fieldValue = service.healthScore || 0;
          break;
        case 'registeredAt':
          fieldValue = service.registeredAt;
          break;
        case 'lastHeartbeat':
          fieldValue = service.lastHeartbeat;
          break;
        case 'capabilities':
          fieldValue = service.capabilities;
          break;
        case 'tags':
          fieldValue = service.tags || [];
          break;
        default:
          // Check metadata
          fieldValue = service.metadata[field];
          break;
      }
      
      // Apply operator
      switch (operator) {
        case 'eq':
          return fieldValue === value;
        case 'ne':
          return fieldValue !== value;
        case 'gt':
          return fieldValue > value;
        case 'gte':
          return fieldValue >= value;
        case 'lt':
          return fieldValue < value;
        case 'lte':
          return fieldValue <= value;
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'nin':
          return Array.isArray(value) && !value.includes(fieldValue);
        case 'contains':
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(value);
          }
          return typeof fieldValue === 'string' && fieldValue.includes(value);
        case 'startsWith':
          return typeof fieldValue === 'string' && fieldValue.startsWith(value);
        case 'endsWith':
          return typeof fieldValue === 'string' && fieldValue.endsWith(value);
        default:
          return true;
      }
    });
  }

  /**
   * Apply sorting to services
   */
  private applySorting(services: MCPServiceInfo[], sortConfig: any[]): MCPServiceInfo[] {
    return services.sort((a, b) => {
      for (const sort of sortConfig) {
        const field = sort.field;
        const direction = sort.direction || 'asc';
        
        let aValue: any;
        let bValue: any;

        // Get field values
        switch (field) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'version':
            aValue = a.version;
            bValue = b.version;
            break;
          case 'registeredAt':
            aValue = a.registeredAt;
            bValue = b.registeredAt;
            break;
          case 'lastHeartbeat':
            aValue = a.lastHeartbeat;
            bValue = b.lastHeartbeat;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'healthScore':
            aValue = a.healthScore || 0;
            bValue = b.healthScore || 0;
            break;
          default:
            // Check metadata
            aValue = a.metadata[field];
            bValue = b.metadata[field];
            break;
        }

        // Compare values
        let comparison = 0;
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Check if a service has the required capabilities
   */
  hasCapabilities(service: MCPServiceInfo, requiredCapabilities: string[]): boolean {
    return requiredCapabilities.every(capability => 
      service.capabilities.includes(capability)
    );
  }

  /**
   * Check capability compatibility between services
   */
  checkCapabilityCompatibility(serviceA: MCPServiceInfo, serviceB: MCPServiceInfo): {
    compatible: boolean;
    commonCapabilities: string[];
    missingInA: string[];
    missingInB: string[];
  } {
    const capabilitiesA = new Set(serviceA.capabilities);
    const capabilitiesB = new Set(serviceB.capabilities);
    
    const commonCapabilities = serviceA.capabilities.filter(cap => capabilitiesB.has(cap));
    const missingInA = serviceB.capabilities.filter(cap => !capabilitiesA.has(cap));
    const missingInB = serviceA.capabilities.filter(cap => !capabilitiesB.has(cap));
    
    return {
      compatible: commonCapabilities.length > 0,
      commonCapabilities,
      missingInA,
      missingInB
    };
  }

  /**
   * Find services with compatible capabilities
   */
  async findCompatibleServices(targetService: MCPServiceInfo): Promise<MCPServiceInfo[]> {
    const allServices = await this.getAll();
    
    return allServices.filter(service => {
      if (service.id === targetService.id) {
        return false; // Don't include the target service itself
      }
      
      const compatibility = this.checkCapabilityCompatibility(service, targetService);
      return compatibility.compatible;
    });
  }

  /**
   * Advanced service discovery with capability matching
   */
  async discoverWithCapabilityMatching(query: ServiceQuery & {
    requiredCapabilities?: string[];
    compatibleWith?: string; // Service ID to find compatible services
    minHealthScore?: number;
    maxAge?: number; // Maximum age in milliseconds
  }): Promise<MCPServiceInfo[]> {
    let services = await this.discover(query);
    
    // Filter by required capabilities
    if (query.requiredCapabilities && query.requiredCapabilities.length > 0) {
      services = services.filter(service => 
        this.hasCapabilities(service, query.requiredCapabilities!)
      );
    }
    
    // Filter by compatibility with another service
    if (query.compatibleWith) {
      const targetService = await this.get(query.compatibleWith);
      if (targetService) {
        services = services.filter(service => {
          const compatibility = this.checkCapabilityCompatibility(service, targetService);
          return compatibility.compatible;
        });
      }
    }
    
    // Filter by minimum health score
    if (query.minHealthScore !== undefined) {
      services = services.filter(service => 
        (service.healthScore || 0) >= query.minHealthScore!
      );
    }
    
    // Filter by maximum age
    if (query.maxAge !== undefined) {
      const now = new Date();
      services = services.filter(service => {
        const age = now.getTime() - service.registeredAt.getTime();
        return age <= query.maxAge!;
      });
    }
    
    return services;
  }

  /**
   * Get service recommendations based on usage patterns and compatibility
   */
  async getServiceRecommendations(
    currentService: MCPServiceInfo,
    options: {
      maxRecommendations?: number;
      includeCompatible?: boolean;
      includeSimilar?: boolean;
      weightByHealth?: boolean;
    } = {}
  ): Promise<MCPServiceInfo[]> {
    const {
      maxRecommendations = 5,
      includeCompatible = true,
      includeSimilar = true,
      weightByHealth = true
    } = options;
    
    let recommendations: MCPServiceInfo[] = [];
    
    // Find compatible services
    if (includeCompatible) {
      const compatible = await this.findCompatibleServices(currentService);
      recommendations.push(...compatible);
    }
    
    // Find similar services (same capabilities)
    if (includeSimilar) {
      const similar = await this.discoverWithCapabilityMatching({
        requiredCapabilities: currentService.capabilities
      });
      recommendations.push(...similar.filter(s => s.id !== currentService.id));
    }
    
    // Remove duplicates
    const uniqueRecommendations = recommendations.filter((service, index, self) =>
      index === self.findIndex(s => s.id === service.id)
    );
    
    // Sort by health score if requested
    if (weightByHealth) {
      uniqueRecommendations.sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));
    }
    
    return uniqueRecommendations.slice(0, maxRecommendations);
  }
}