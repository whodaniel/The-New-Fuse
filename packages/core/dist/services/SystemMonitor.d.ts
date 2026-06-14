/**
 * @fileoverview Production-ready system monitoring service
 */
import { SystemMetrics, HealthStatus } from '../types/monitoring.js';
import { ServiceState } from '../constants/types.js';
export declare class SystemMonitor {
    private state;
    private monitoringInterval?;
    private services;
    private startTime;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    registerService(name: string, healthCheckUrl?: string): void;
    unregisterService(name: string): void;
    getSystemMetrics(): Promise<SystemMetrics>;
    getHealthStatus(): Promise<HealthStatus>;
    private performHealthCheck;
    private checkServiceHealth;
    private simulateHealthCheck;
    private calculateOverallStatus;
    private getCPUMetrics;
    private getMemoryMetrics;
    private getDiskMetrics;
    private getNetworkMetrics;
}
//# sourceMappingURL=SystemMonitor.d.ts.map