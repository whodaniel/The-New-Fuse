/**
 * Advanced Performance Monitoring System
 * Provides real-time performance tracking, alerting, and analysis
 */
import { EventEmitter } from 'events';
export interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    labels?: Record<string, string>;
    unit?: string;
}
export interface AlertRule {
    id: string;
    name: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
}
export interface Alert {
    id: string;
    rule: AlertRule;
    value: number;
    timestamp: number;
    resolved?: boolean;
    resolvedAt?: number;
}
export interface PerformanceDashboard {
    metrics: PerformanceMetric[];
    alerts: Alert[];
    summary: {
        totalMetrics: number;
        activeAlerts: number;
        avgResponseTime: number;
        errorRate: number;
        throughput: number;
    };
}
export interface MonitoringConfig {
    metricsRetentionPeriod: number;
    alertCheckInterval: number;
    maxMetricsInMemory: number;
    enableRealTimeUpdates: boolean;
    exportInterval: number;
}
export declare class PerformanceMonitoringSystem extends EventEmitter {
    private metrics;
    private alerts;
    private alertRules;
    private alertTimers;
    private config;
    private cleanupInterval;
    private alertCheckInterval;
    constructor(config?: Partial<MonitoringConfig>);
    recordMetric(metric: PerformanceMetric): void;
    recordMetrics(metrics: PerformanceMetric[]): void;
    getMetrics(name: string, startTime?: number, endTime?: number, labels?: Record<string, string>): PerformanceMetric[];
    getAggregatedMetrics(name: string, aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99', startTime?: number, endTime?: number, labels?: Record<string, string>): number;
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(ruleId: string): void;
    updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void;
    getAlertRules(): AlertRule[];
    getActiveAlerts(): Alert[];
    resolveAlert(alertId: string): void;
    getDashboard(): PerformanceDashboard;
    getHealthStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        checks: Array<{
            name: string;
            status: 'pass' | 'fail';
            message: string;
        }>;
    };
    exportMetrics(format?: 'json' | 'prometheus'): string;
    shutdown(): void;
    private getMetricKey;
    private percentile;
    private checkAlertsForMetric;
    private evaluateAlertCondition;
    private triggerAlert;
    private clearAlertTimer;
    private startCleanupProcess;
    private startAlertChecking;
    private exportPrometheusFormat;
}
export declare const DEFAULT_ALERT_RULES: AlertRule[];
export declare function createPerformanceMonitor(config?: Partial<MonitoringConfig>): PerformanceMonitoringSystem;
export declare function recordResponseTime(monitor: PerformanceMonitoringSystem, duration: number, endpoint?: string): void;
export declare function recordError(monitor: PerformanceMonitoringSystem, error: Error, component?: string): void;
export declare function recordThroughput(monitor: PerformanceMonitoringSystem, count: number, operation?: string): void;
export declare function recordResourceUsage(monitor: PerformanceMonitoringSystem): void;
//# sourceMappingURL=monitoring.d.ts.map