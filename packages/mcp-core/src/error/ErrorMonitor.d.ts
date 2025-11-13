/**
 * Error Monitoring and Metrics Collection System
 */
import { EventEmitter } from 'events';
import { MCPErrorClass, ErrorCategory, ErrorSeverity, ErrorStatistics } from '../types/error';
import { Logger } from '../utils/Logger';
export interface ErrorMetrics {
    /** Total error count */
    totalErrors: number;
    /** Error rate (errors per minute) */
    errorRate: number;
    /** Average error rate over time */
    averageErrorRate: number;
    /** Error distribution by category */
    categoryDistribution: Record<ErrorCategory, number>;
    /** Error distribution by severity */
    severityDistribution: Record<ErrorSeverity, number>;
    /** Top error codes */
    topErrorCodes: Array<{
        code: number;
        count: number;
        percentage: number;
    }>;
    /** Error trends */
    trends: {
        increasing: boolean;
        changeRate: number;
        timeWindow: string;
    };
    /** System health score (0-100) */
    healthScore: number;
}
export interface AlertRule {
    /** Rule name */
    name: string;
    /** Rule description */
    description: string;
    /** Condition function */
    condition: (metrics: ErrorMetrics, statistics: ErrorStatistics) => boolean;
    /** Alert severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Cooldown period (ms) */
    cooldown: number;
    /** Last triggered timestamp */
    lastTriggered?: Date;
    /** Alert action */
    action: (metrics: ErrorMetrics, statistics: ErrorStatistics) => Promise<void>;
}
export interface MonitorConfig {
    /** Metrics collection interval (ms) */
    metricsInterval: number;
    /** Error history retention period (ms) */
    retentionPeriod: number;
    /** Enable alerting */
    enableAlerting: boolean;
    /** Alert check interval (ms) */
    alertInterval: number;
    /** Health score calculation weights */
    healthWeights: {
        errorRate: number;
        severity: number;
        recovery: number;
        trends: number;
    };
}
/**
 * Error monitoring system
 */
export declare class ErrorMonitor extends EventEmitter {
    private readonly config;
    private readonly logger;
    private readonly errorHistory;
    private readonly alertRules;
    private readonly metricsHistory;
    private metricsTimer?;
    private alertTimer?;
    private currentMetrics;
    constructor(config?: Partial<MonitorConfig>, logger?: Logger);
    /**
     * Record an error occurrence
     */
    recordError(error: MCPErrorClass): void;
    /**
     * Get current metrics
     */
    getCurrentMetrics(): ErrorMetrics;
    /**
     * Get metrics history
     */
    getMetricsHistory(hours?: number): Array<{
        metrics: ErrorMetrics;
        timestamp: Date;
    }>;
    /**
     * Register an alert rule
     */
    registerAlertRule(rule: AlertRule): void;
}
//# sourceMappingURL=ErrorMonitor.d.ts.map