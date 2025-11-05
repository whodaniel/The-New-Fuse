/**
 * Director Service - System Orchestration and Coordination
 *
 * Central service responsible for coordinating all system components,
 * managing service discovery, load balancing, and ensuring system-wide
 * consistency and reliability.
 */
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
export interface ServiceHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    lastChecked: Date;
    error?: string;
}
export interface SystemMetrics {
    totalServices: number;
    healthyServices: number;
    averageResponseTime: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export declare class DirectorService {
    private configService;
    private moduleRef;
    private readonly logger;
    private serviceRegistry;
    private healthChecks;
    private systemStartTime;
    constructor(configService: ConfigService, moduleRef: ModuleRef);
    /**
     * Initialize the director service and start monitoring
     */
    private initializeDirector;
    /**
     * Discover and register all available services
     */
    private discoverServices;
    /**
     * Start health monitoring for all registered services
     */
    private startHealthMonitoring;
    /**
     * Check the health of a specific service
     */
    private checkServiceHealth;
    /**
     * Initialize load balancers for different service types
     */
    private initializeLoadBalancers;
    /**
     * Initialize agent load balancer
     */
    private initializeAgentLoadBalancer;
    /**
     * Initialize workflow load balancer
     */
    private initializeWorkflowLoadBalancer;
    /**
     * Get comprehensive system metrics
     */
    getSystemMetrics(): Promise<SystemMetrics>;
    /**
     * Get health status of all services
     */
    getAllServiceHealth(): Promise<ServiceHealth[]>;
    /**
     * Coordinate service failover
     */
    handleServiceFailover(serviceName: string, failedInstance: string): Promise<void>;
    /**
     * Gracefully shutdown the director service
     */
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=director.service.d.ts.map