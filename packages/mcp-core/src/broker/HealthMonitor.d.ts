/**
 * Health Monitor Implementation
 *
 * Monitors the health of registered MCP services through periodic health checks
 * and provides health status reporting and automatic cleanup capabilities.
 */
import { EventEmitter } from 'events';
import { ServiceHealth, HealthCheckConfig } from '../types';
import { ServiceStatus } from '../types/common';
/**
 * Health Monitor class for monitoring MCP service health
 */
export declare class HealthMonitor extends EventEmitter {
    private config;
    private services;
    private globalInterval?;
    private isStarted;
    constructor(config: HealthCheckConfig);
    /**
     * Start the health monitor
     */
    start(): Promise<void>;
    /**
     * Stop the health monitor
     */
    stop(): Promise<void>;
    /**
     * Add a service to health monitoring
     */
    addService(serviceId: string, endpoint: string): Promise<void>;
    /**
     * Remove a service from health monitoring
     */
    removeService(serviceId: string): Promise<void>;
    /**
     * Get health status of a specific service
     */
    getServiceHealth(serviceId: string): Promise<ServiceHealth | null>;
    /**
     * Get health status of all monitored services
     */
    getAllServiceHealth(): Promise<ServiceHealth[]>;
    /**
     * Force a health check for a specific service
     */
    checkServiceHealth(serviceId: string): Promise<ServiceHealth>;
    /**
     * Get health monitor statistics
     */
    getStatistics(): {
        totalServices: number;
        statusCounts: Record<ServiceStatus, number>;
        averageResponseTime: number;
        averageHealthScore: number;
        healthyServices: number;
        unhealthyServices: number;
    };
    /**
     * Perform health checks for all monitored services
     */
    private performHealthChecks;
    /**
     * Perform actual health check against service endpoint
     */
    private performHealthCheck;
    /**
     * Calculate health score based on various factors
     */
    private calculateHealthScore;
}
//# sourceMappingURL=HealthMonitor.d.ts.map