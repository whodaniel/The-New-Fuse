/**
 * @fileoverview Production-ready performance monitoring service
 */
import { PerformanceMetrics } from '../types/monitoring';
import { ServiceState } from '../constants/types';
import { MetricsCollector } from './MetricsCollector';
import { SystemMonitor } from './SystemMonitor';
export declare class PerformanceMonitor {
    private readonly metricsCollector;
    private readonly systemMonitor;
    private state;
    private monitoringInterval?;
    private startTime;
    private requestCount;
    private errorCount;
    private responseTimes;
    private activeConnections;
    constructor(metricsCollector: MetricsCollector, systemMonitor: SystemMonitor);
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    monitor(): Promise<PerformanceMetrics>;
    recordRequest(responseTime: number, isError?: boolean): void;
    recordConnectionChange(delta: number): void;
    recordDatabaseConnection(active: number, idle: number): void;
    recordMemoryUsage(): void;
    recordEventLoopLag(): void;
    private collectPerformanceMetrics;
    private getApplicationMetrics;
    private calculateResponseTimeStats;
    private calculatePercentile;
    private recordSystemMetrics;
    private recordApplicationMetrics;
    trackOperation<T>(operationName: string, operation: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    trackOperationSync<T>(operationName: string, operation: () => T, tags?: Record<string, string>): T;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map