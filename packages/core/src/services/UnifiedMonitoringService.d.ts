/**
 * @fileoverview Unified monitoring service that orchestrates all monitoring capabilities
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SystemMonitor } from './SystemMonitor';
import { MetricsCollector } from './MetricsCollector';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceMetrics, HealthStatus, Alert, AlertSeverity } from '../types/monitoring';
import { ServiceState } from '../constants/types';
export declare class UnifiedMonitoringService implements OnModuleInit, OnModuleDestroy {
    private readonly systemMonitor;
    private readonly metricsCollector;
    private readonly performanceMonitor;
    private state;
    private alerts;
    private alertCallbacks;
    constructor(systemMonitor: SystemMonitor, metricsCollector: MetricsCollector, performanceMonitor: PerformanceMonitor);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    monitor(): Promise<PerformanceMetrics>;
    getHealthStatus(): Promise<HealthStatus>;
    recordMetric(name: string, value: number, tags?: Record<string, string>): void;
    recordCounter(name: string, value?: number, tags?: Record<string, string>): void;
    recordTimer(name: string, duration: number, tags?: Record<string, string>): void;
    captureError(error: Error, context?: Record<string, any>): void;
    registerService(name: string, healthCheckUrl?: string): void;
    unregisterService(name: string): void;
    recordRequest(responseTime: number, isError?: boolean): void;
    recordConnectionChange(delta: number): void;
    recordDatabaseConnection(active: number, idle: number): void;
    createAlert(name: string, description: string, severity: AlertSeverity, condition: {
        metric: string;
        operator: 'greater' | 'less' | 'equals' | 'not_equals';
        threshold: number;
        duration: number;
    }): string;
    resolveAlert(alertId: string): boolean;
    getAlerts(): Alert[];
    getActiveAlerts(): Alert[];
    onAlert(callback: (alert: Alert) => void): void;
    trackOperation<T>(operationName: string, operation: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    trackOperationSync<T>(operationName: string, operation: () => T, tags?: Record<string, string>): T;
    getMetricsSummary(): Record<string, any>;
    getSystemStatus(): Promise<{
        health: HealthStatus;
        performance: PerformanceMetrics;
        alerts: Alert[];
        metrics: Record<string, any>;
    }>;
    private ensureRunning;
    private checkErrorAlert;
    private notifyAlertCallbacks;
}
//# sourceMappingURL=UnifiedMonitoringService.d.ts.map