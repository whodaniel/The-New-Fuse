/**
 * Load Balancer Implementation
 * 
 * Provides load balancing capabilities for distributing requests across
 * multiple MCP service instances using various strategies.
 */

import { MCPServiceInfo } from '../types/broker';
import { LoadBalancingConfig } from '../types/broker';
import { LoadBalancingStrategy, ServiceStatus } from '../types/common';
import { MCPErrorClass, MCPErrorCode } from '../types/error';

/**
 * Service instance tracking for load balancing
 */
interface ServiceInstance {
  service: MCPServiceInfo;
  isHealthy: boolean;
  connectionCount: number;
  totalRequests: number;
  lastRequestTime: Date;
  weight: number;
}

/**
 * Load balancer statistics
 */
interface LoadBalancerStats {
  totalServices: number;
  healthyServices: number;
  totalRequests: number;
  requestDistribution: Record<string, number>;
  averageConnectionsPerService: number;
}

/**
 * Load Balancer class for distributing requests across MCP services
 */
export class LoadBalancer {
  private config: LoadBalancingConfig;
  private services: Map<string, ServiceInstance> = new Map();
  private roundRobinIndex: number = 0;
  private stickySessionMap: Map<string, string> = new Map(); // sessionId -> serviceId

  constructor(config: LoadBalancingConfig) {
    this.config = config;
  }

  /**
   * Add a service to the load balancer
   */
  addService(service: MCPServiceInfo): void {
    const weight = this.config.weights?.[service.id] || 1;
    
    const instance: ServiceInstance = {
      service,
      isHealthy: service.status === ServiceStatus.ONLINE,
      connectionCount: 0,
      totalRequests: 0,
      lastRequestTime: new Date(),
      weight
    };

    this.services.set(service.id, instance);
    console.log(`Added service to load balancer: ${service.name} (${service.id}) with weight ${weight}`);
  }

  /**
   * Remove a service from the load balancer
   */
  removeService(serviceId: string): void {
    const instance = this.services.get(serviceId);
    if (instance) {
      this.services.delete(serviceId);
      
      // Clean up sticky sessions for this service
      for (const [sessionId, mappedServiceId] of this.stickySessionMap.entries()) {
        if (mappedServiceId === serviceId) {
          this.stickySessionMap.delete(sessionId);
        }
      }
      
      console.log(`Removed service from load balancer: ${instance.service.name} (${serviceId})`);
    }
  }

  /**
   * Update service information
   */
  updateService(service: MCPServiceInfo): void {
    const instance = this.services.get(service.id);
    if (instance) {
      instance.service = service;
      instance.isHealthy = service.status === ServiceStatus.ONLINE;
      console.log(`Updated service in load balancer: ${service.name} (${service.id})`);
    }
  }

  /**
   * Mark a service as healthy
   */
  markServiceHealthy(serviceId: string): void {
    const instance = this.services.get(serviceId);
    if (instance) {
      instance.isHealthy = true;
      console.log(`Marked service as healthy: ${serviceId}`);
    }
  }

  /**
   * Mark a service as unhealthy
   */
  markServiceUnhealthy(serviceId: string): void {
    const instance = this.services.get(serviceId);
    if (instance) {
      instance.isHealthy = false;
      console.log(`Marked service as unhealthy: ${serviceId}`);
    }
  }

  /**
   * Select a service instance based on the configured load balancing strategy
   */
  selectService(sessionId?: string, strategy?: LoadBalancingStrategy): MCPServiceInfo | null {
    const availableServices = this.getAvailableServices();
    
    if (availableServices.length === 0) {
      return null;
    }

    const selectedStrategy = strategy || this.config.defaultStrategy;
    let selectedInstance: ServiceInstance | null = null;

    // Check for sticky session first
    if (this.config.stickySession && sessionId) {
      const stickyServiceId = this.stickySessionMap.get(sessionId);
      if (stickyServiceId) {
        const stickyInstance = availableServices.find(instance => instance.service.id === stickyServiceId);
        if (stickyInstance) {
          selectedInstance = stickyInstance;
        }
      }
    }

    // If no sticky session or sticky service unavailable, use strategy
    if (!selectedInstance) {
      switch (selectedStrategy) {
        case LoadBalancingStrategy.ROUND_ROBIN:
          selectedInstance = this.selectRoundRobin(availableServices);
          break;
        case LoadBalancingStrategy.LEAST_CONNECTIONS:
          selectedInstance = this.selectLeastConnections(availableServices);
          break;
        case LoadBalancingStrategy.WEIGHTED:
          selectedInstance = this.selectWeighted(availableServices);
          break;
        case LoadBalancingStrategy.RANDOM:
          selectedInstance = this.selectRandom(availableServices);
          break;
        default:
          throw new MCPErrorClass(
            MCPErrorCode.INVALID_PARAMS,
            `Unknown load balancing strategy: ${selectedStrategy}`
          );
      }

      // Set up sticky session if enabled
      if (this.config.stickySession && sessionId && selectedInstance) {
        this.stickySessionMap.set(sessionId, selectedInstance.service.id);
      }
    }

    if (selectedInstance) {
      // Update request tracking
      selectedInstance.totalRequests++;
      selectedInstance.lastRequestTime = new Date();
      
      return selectedInstance.service;
    }

    return null;
  }

  /**
   * Increment connection count for a service
   */
  incrementConnections(serviceId: string): void {
    const instance = this.services.get(serviceId);
    if (instance) {
      instance.connectionCount++;
    }
  }

  /**
   * Decrement connection count for a service
   */
  decrementConnections(serviceId: string): void {
    const instance = this.services.get(serviceId);
    if (instance) {
      instance.connectionCount = Math.max(0, instance.connectionCount - 1);
    }
  }

  /**
   * Get load balancer statistics
   */
  getStatistics(): LoadBalancerStats {
    const services = Array.from(this.services.values());
    const healthyServices = services.filter(instance => instance.isHealthy);
    const totalRequests = services.reduce((sum, instance) => sum + instance.totalRequests, 0);
    
    const requestDistribution = services.reduce((acc, instance) => {
      acc[instance.service.id] = instance.totalRequests;
      return acc;
    }, {} as Record<string, number>);

    const averageConnectionsPerService = services.length > 0 
      ? services.reduce((sum, instance) => sum + instance.connectionCount, 0) / services.length 
      : 0;

    return {
      totalServices: services.length,
      healthyServices: healthyServices.length,
      totalRequests,
      requestDistribution,
      averageConnectionsPerService
    };
  }

  /**
   * Get all service instances
   */
  getAllServices(): ServiceInstance[] {
    return Array.from(this.services.values());
  }

  /**
   * Clear sticky session
   */
  clearStickySession(sessionId: string): void {
    this.stickySessionMap.delete(sessionId);
  }

  /**
   * Get available (healthy) services for load balancing
   */
  private getAvailableServices(): ServiceInstance[] {
    const services = Array.from(this.services.values());
    
    if (this.config.useHealthCheck) {
      return services.filter(instance => instance.isHealthy);
    }
    
    return services;
  }

  /**
   * Round-robin selection strategy
   */
  private selectRoundRobin(services: ServiceInstance[]): ServiceInstance {
    const selectedInstance = services[this.roundRobinIndex % services.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % services.length;
    return selectedInstance;
  }

  /**
   * Least connections selection strategy
   */
  private selectLeastConnections(services: ServiceInstance[]): ServiceInstance {
    return services.reduce((least, current) => 
      current.connectionCount < least.connectionCount ? current : least
    );
  }

  /**
   * Weighted selection strategy
   */
  private selectWeighted(services: ServiceInstance[]): ServiceInstance {
    const totalWeight = services.reduce((sum, instance) => sum + instance.weight, 0);
    
    if (totalWeight === 0) {
      return this.selectRandom(services);
    }

    let random = Math.random() * totalWeight;
    
    for (const instance of services) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    // Fallback to last service if rounding errors occur
    return services[services.length - 1];
  }

  /**
   * Random selection strategy
   */
  private selectRandom(services: ServiceInstance[]): ServiceInstance {
    const randomIndex = Math.floor(Math.random() * services.length);
    return services[randomIndex];
  }
}