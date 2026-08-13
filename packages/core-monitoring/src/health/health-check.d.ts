/**
 * Health Check System
 * Provides comprehensive health checking for all service dependencies
 */
import { EventEmitter } from 'events';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export interface HealthCheckResult {
    status: HealthStatus;
    timestamp: Date;
    duration: number;
    message?: string;
    details?: any;
}
export interface ServiceHealth {
    name: string;
    status: HealthStatus;
    timestamp: Date;
    responseTime: number;
    message?: string;
    error?: string;
    details?: any;
}
export interface SystemHealthStatus {
    status: HealthStatus;
    timestamp: Date;
    uptime: number;
    version: string;
    services: Record<string, ServiceHealth>;
    metrics: {
        totalChecks: number;
        healthyChecks: number;
        degradedChecks: number;
        unhealthyChecks: number;
        averageResponseTime: number;
    };
}
export type HealthCheckFunction = () => Promise<HealthCheckResult>;
/**
 * Health Check Service
 */
export declare class HealthCheckService extends EventEmitter {
    private checks;
    private results;
    private startTime;
    private intervalId?;
    private config;
    constructor(config?: {
        checkInterval?: number;
        timeout?: number;
    });
    /**
     * Register a health check
     */
    register(name: string, check: HealthCheckFunction): void;
    /**
     * Unregister a health check
     */
    unregister(name: string): void;
    /**
     * Run all health checks
     */
    check(): Promise<SystemHealthStatus>;
    /**
     * Run a single health check with timeout
     */
    private runCheck;
    /**
     * Start periodic health checks
     */
    startPeriodicChecks(): void;
    /**
     * Stop periodic health checks
     */
    stopPeriodicChecks(): void;
    /**
     * Get current health status
     */
    getStatus(): SystemHealthStatus | null;
}
/**
 * Common health check implementations
 */
export declare class CommonHealthChecks {
    /**
     * Database health check
     */
    static database(client: any, queryFn?: () => Promise<any>): HealthCheckFunction;
    /**
     * Redis health check
     */
    static redis(client: any): HealthCheckFunction;
    /**
     * HTTP service health check
     */
    static httpService(url: string, timeout?: number): HealthCheckFunction;
    /**
     * Memory usage health check
     */
    static memory(thresholdPercent?: number): HealthCheckFunction;
    /**
     * Disk space health check
     */
    static diskSpace(path?: string, thresholdPercent?: number): HealthCheckFunction;
}
//# sourceMappingURL=health-check.d.ts.map