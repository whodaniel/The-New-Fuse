/**
 * Load Balancer Implementation
 *
 * Provides load balancing capabilities for distributing requests across
 * multiple MCP service instances using various strategies.
 */
import { MCPServiceInfo } from '../types/broker';
import { LoadBalancingConfig } from '../types/broker';
import { LoadBalancingStrategy } from '../types/common';
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
export declare class LoadBalancer {
    private config;
    private services;
    private roundRobinIndex;
    private stickySessionMap;
    constructor(config: LoadBalancingConfig);
    /**
     * Add a service to the load balancer
     */
    addService(service: MCPServiceInfo): void;
    /**
     * Remove a service from the load balancer
     */
    removeService(serviceId: string): void;
    /**
     * Update service information
     */
    updateService(service: MCPServiceInfo): void;
    /**
     * Mark a service as healthy
     */
    markServiceHealthy(serviceId: string): void;
    /**
     * Mark a service as unhealthy
     */
    markServiceUnhealthy(serviceId: string): void;
    /**
     * Select a service instance based on the configured load balancing strategy
     */
    selectService(sessionId?: string, strategy?: LoadBalancingStrategy): MCPServiceInfo | null;
    /**
     * Increment connection count for a service
     */
    incrementConnections(serviceId: string): void;
    /**
     * Decrement connection count for a service
     */
    decrementConnections(serviceId: string): void;
    /**
     * Get load balancer statistics
     */
    getStatistics(): LoadBalancerStats;
    /**
     * Get all service instances
     */
    getAllServices(): ServiceInstance[];
    /**
     * Clear sticky session
     */
    clearStickySession(sessionId: string): void;
    /**
     * Select multiple services for load distribution
     */
    selectMultipleServices(count: number, sessionId?: string, strategy?: LoadBalancingStrategy, excludeServices?: string[]): MCPServiceInfo[];
    /**
     * Get service selection recommendations based on current load and health
     */
    getServiceSelectionRecommendations(requiredCapabilities?: string[], preferredTags?: string[]): {
        primary: MCPServiceInfo | null;
        alternatives: MCPServiceInfo[];
        loadDistribution: Record<string, number>;
    };
    /**
     * Predict optimal service selection based on historical patterns
     */
    predictOptimalSelection(requestType?: string, expectedLoad?: number, timeOfDay?: number): {
        recommendedServices: MCPServiceInfo[];
        confidence: number;
        reasoning: string[];
    };
    /**
     * Get available (healthy) services for load balancing
     */
    private getAvailableServices;
    /**
     * Round-robin selection strategy
     */
    private selectRoundRobin;
    /**
     * Least connections selection strategy
     */
    private selectLeastConnections;
    /**
     * Weighted selection strategy
     */
    private selectWeighted;
    /**
     * Random selection strategy
     */
    private selectRandom;
}
export {};
//# sourceMappingURL=LoadBalancer.d.ts.map