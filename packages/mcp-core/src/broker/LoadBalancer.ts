/**
 * Load Balancer Implementation
 * 
 * Provides load balancing capabilities for distributing requests across
 * multiple MCP service instances using various strategies.
 */

import { MCPServiceInfo } from '../types/broker.js';
import { LoadBalancingConfig } from '../types/broker.js';
import { LoadBalancingStrategy, ServiceStatus } from '../types/common.js';
import { MCPErrorClass, MCPErrorCode } from '../types/error.js';

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
   * Select multiple services for load distribution
   */
  selectMultipleServices(
    count: number, 
    sessionId?: string, 
    strategy?: LoadBalancingStrategy,
    excludeServices?: string[]
  ): MCPServiceInfo[] {
    const availableServices = this.getAvailableServices()
      .filter(instance => !excludeServices?.includes(instance.service.id));
    
    if (availableServices.length === 0) {
      return [];
    }

    const selectedServices: MCPServiceInfo[] = [];
    const selectedStrategy = strategy || this.config.defaultStrategy;
    const requestedCount = Math.min(count, availableServices.length);

    switch (selectedStrategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        for (let i = 0; i < requestedCount; i++) {
          const instance = this.selectRoundRobin(availableServices);
          selectedServices.push(instance.service);
        }
        break;
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        // Sort by connection count and take the least loaded services
        const sortedByConnections = [...availableServices]
          .sort((a, b) => a.connectionCount - b.connectionCount);
        selectedServices.push(...sortedByConnections.slice(0, requestedCount).map(i => i.service));
        break;
      case LoadBalancingStrategy.WEIGHTED:
        // Use weighted selection multiple times
        for (let i = 0; i < requestedCount; i++) {
          const instance = this.selectWeighted(availableServices);
          selectedServices.push(instance.service);
        }
        break;
      case LoadBalancingStrategy.RANDOM:
        // Randomly select unique services
        const shuffled = [...availableServices].sort(() => Math.random() - 0.5);
        selectedServices.push(...shuffled.slice(0, requestedCount).map(i => i.service));
        break;
    }

    return selectedServices;
  }

  /**
   * Get service selection recommendations based on current load and health
   */
  getServiceSelectionRecommendations(
    requiredCapabilities?: string[],
    preferredTags?: string[]
  ): {
    primary: MCPServiceInfo | null;
    alternatives: MCPServiceInfo[];
    loadDistribution: Record<string, number>;
  } {
    const availableServices = this.getAvailableServices();
    
    // Filter by capabilities if specified
    let candidateServices = availableServices;
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      candidateServices = availableServices.filter(instance =>
        requiredCapabilities.every(cap => instance.service.capabilities.includes(cap))
      );
    }

    // Filter by preferred tags if specified
    if (preferredTags && preferredTags.length > 0) {
      const preferredServices = candidateServices.filter(instance =>
        instance.service.tags?.some(tag => preferredTags.includes(tag))
      );
      if (preferredServices.length > 0) {
        candidateServices = preferredServices;
      }
    }

    if (candidateServices.length === 0) {
      return {
        primary: null,
        alternatives: [],
        loadDistribution: {}
      };
    }

    // Calculate load scores for each service
    const scoredServices = candidateServices.map(instance => {
      let score = 0;
      
      // Health score (higher is better)
      score += (instance.service.healthScore || 0.5) * 0.4;
      
      // Connection load (lower is better)
      const maxConnections = Math.max(...candidateServices.map(s => s.connectionCount), 1);
      const connectionScore = 1 - (instance.connectionCount / maxConnections);
      score += connectionScore * 0.3;
      
      // Request load (lower is better)
      const maxRequests = Math.max(...candidateServices.map(s => s.totalRequests), 1);
      const requestScore = 1 - (instance.totalRequests / maxRequests);
      score += requestScore * 0.2;
      
      // Recency bonus (more recently used services might be warmed up)
      const timeSinceLastRequest = Date.now() - instance.lastRequestTime.getTime();
      const recencyScore = Math.max(0, 1 - (timeSinceLastRequest / (5 * 60 * 1000))); // 5 minutes
      score += recencyScore * 0.1;
      
      return { instance, score };
    });

    // Sort by score (descending)
    scoredServices.sort((a, b) => b.score - a.score);

    // Calculate load distribution
    const loadDistribution = candidateServices.reduce((acc, instance) => {
      const percentage = candidateServices.length > 0 
        ? (instance.totalRequests / candidateServices.reduce((sum, s) => sum + s.totalRequests, 1)) * 100
        : 0;
      acc[instance.service.id] = Math.round(percentage * 100) / 100;
      return acc;
    }, {} as Record<string, number>);

    return {
      primary: scoredServices[0]?.instance.service || null,
      alternatives: scoredServices.slice(1, 4).map(item => item.instance.service),
      loadDistribution
    };
  }

  /**
   * Predict optimal service selection based on historical patterns
   */
  predictOptimalSelection(
    requestType?: string,
    expectedLoad?: number,
    timeOfDay?: number
  ): {
    recommendedServices: MCPServiceInfo[];
    confidence: number;
    reasoning: string[];
  } {
    const availableServices = this.getAvailableServices();
    const reasoning: string[] = [];
    
    if (availableServices.length === 0) {
      return {
        recommendedServices: [],
        confidence: 0,
        reasoning: ['No services available']
      };
    }

    // Simple prediction based on current metrics
    let recommendedServices = [...availableServices];
    let confidence = 0.7; // Base confidence

    // Sort by health and load
    recommendedServices.sort((a, b) => {
      const scoreA = (a.service.healthScore || 0.5) - (a.connectionCount * 0.1);
      const scoreB = (b.service.healthScore || 0.5) - (b.connectionCount * 0.1);
      return scoreB - scoreA;
    });

    reasoning.push(`Sorted ${availableServices.length} services by health and current load`);

    // Consider expected load
    if (expectedLoad && expectedLoad > 10) {
      // For high load, prefer services with lower current load
      recommendedServices = recommendedServices.filter(instance => 
        instance.connectionCount < expectedLoad * 0.5
      );
      reasoning.push(`Filtered services for high expected load (${expectedLoad})`);
      confidence += 0.1;
    }

    // Consider time of day patterns (simple heuristic)
    if (timeOfDay !== undefined) {
      // During peak hours (9-17), prefer services with higher capacity
      if (timeOfDay >= 9 && timeOfDay <= 17) {
        recommendedServices = recommendedServices.filter(instance =>
          (instance.service.healthScore || 0.5) > 0.7
        );
        reasoning.push('Filtered for peak hours - preferring high-capacity services');
        confidence += 0.05;
      }
    }

    return {
      recommendedServices: recommendedServices.slice(0, 3).map(i => i.service),
      confidence: Math.min(confidence, 1.0),
      reasoning
    };
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