/**
 * System Health Monitoring System
 */
import { EventEmitter } from 'events';
import { ISystemHealthMonitor, SystemHealthStatus, HealthCheck, HealthCheckResult } from '../interfaces/IMonitoring';
import { Logger } from '../utils/Logger';
export interface SystemHealthMonitorConfig {
    /** Health check interval (ms) */
    checkInterval: number;
    /** Health check timeout (ms) */
    timeout: number;
}
/**
 * System health monitor implementation
 */
export declare class SystemHealthMonitor extends EventEmitter implements ISystemHealthMonitor {
    private readonly config;
    private readonly logger;
    private readonly healthChecks;
    private readonly checkResults;
    private readonly resultHistory;
    private checkTimer?;
    private running;
    constructor(config: SystemHealthMonitorConfig, logger?: Logger);
    /**
     * Start health monitoring
     */
    start(): void;
    /**
     * Stop health monitoring
     */
    stop(): void;
    /**
     * Get system health status
     */
    getHealthStatus(): Promise<SystemHealthStatus>;
    /**
     * Get health check results
     */
    getHealthChecks(): Promise<HealthCheckResult[]>;
    /**
     * Register health check
     */
    registerHealthCheck(check: HealthCheck): void;
    /**
     * Remove health check
     */
    removeHealthCheck(name: string): boolean;
    /**
     * Run all health checks
     */
    runHealthChecks(): Promise<HealthCheckResult[]>;
    /**
     * Run a single health check with timeout
     */
    private runSingleHealthCheck;
    /**
     * Initialize default health checks
     */
    private initializeDefaultHealthChecks;
    /**
     * Measure network latency (simple localhost ping)
     */
    private measureNetworkLatency;
    /**
     * Get overall system health status
     */
    private getOverallStatus;
    /**
     * Clean up old health check results
     */
    private cleanupHistory;
}
//# sourceMappingURL=SystemHealthMonitor.d.ts.map