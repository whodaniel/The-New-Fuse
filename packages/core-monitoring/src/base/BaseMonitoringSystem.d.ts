/**
 * Base monitoring system implementation
 * Provides common functionality that can be extended by specific monitoring systems
 */
import { EventEmitter } from 'events';
import { IMonitoringSystem, IMetricsCollector, IAlertManager, IPerformanceMonitor, IDashboardManager, ISystemHealthMonitor } from '../interfaces/IMonitoring.js';
import { Logger } from '../utils/Logger.js';
/**
 * Base monitoring configuration
 */
export interface BaseMonitoringConfig {
    enabled: boolean;
    metricsInterval: number;
    retentionPeriod: number;
    enableAlerting?: boolean;
    enableDashboards?: boolean;
    alertInterval?: number;
    dashboardRefreshInterval?: number;
    storage?: {
        type: 'memory' | 'file' | 'database';
        options?: Record<string, any>;
    };
}
/**
 * Base monitoring system that can be extended
 */
export declare abstract class BaseMonitoringSystem<TMetrics = any, TConfig extends BaseMonitoringConfig = BaseMonitoringConfig> extends EventEmitter implements IMonitoringSystem<TMetrics, TConfig> {
    protected readonly logger: Logger;
    protected config?: TConfig;
    protected running: boolean;
    protected startTime?: Date;
    protected metricsCollector?: IMetricsCollector<TMetrics>;
    protected alertManager?: IAlertManager;
    protected performanceMonitor?: IPerformanceMonitor;
    protected dashboardManager?: IDashboardManager;
    protected systemHealthMonitor?: ISystemHealthMonitor;
    constructor(logger?: Logger);
    /**
     * Initialize monitoring system
     */
    initialize(config: TConfig): Promise<void>;
    /**
     * Shutdown monitoring system
     */
    shutdown(): Promise<void>;
    /**
     * Get metrics collector
     */
    getMetricsCollector(): IMetricsCollector<TMetrics>;
    /**
     * Export metrics in specified format
     */
    exportMetrics(format: 'prometheus' | 'json'): Promise<string>;
    /**
     * Get monitoring status
     */
    getStatus(): Promise<{
        running: boolean;
        uptime: number;
        components: Record<string, boolean>;
    }>;
    /**
     * Abstract method to create metrics collector
     * Must be implemented by subclasses
     */
    protected abstract createMetricsCollector(): IMetricsCollector<TMetrics>;
    /**
     * Abstract method to format metrics for Prometheus
     * Can be overridden by subclasses for custom formatting
     */
    protected abstract formatPrometheusMetrics(metrics: TMetrics): string;
    /**
     * Initialize all components
     */
    protected initializeComponents(): Promise<void>;
    /**
     * Start all components
     */
    protected startComponents(): Promise<void>;
    /**
     * Stop all components
     */
    protected stopComponents(): Promise<void>;
    /**
     * Set up event forwarding from components
     */
    protected setupEventForwarding(): void;
    /**
     * Create alert manager - can be overridden by subclasses
     */
    protected createAlertManager(): IAlertManager | undefined;
    /**
     * Create dashboard manager - can be overridden by subclasses
     */
    protected createDashboardManager(): IDashboardManager | undefined;
    /**
     * Create performance monitor - can be overridden by subclasses
     */
    protected createPerformanceMonitor(): IPerformanceMonitor | undefined;
    /**
     * Create system health monitor - can be overridden by subclasses
     */
    protected createSystemHealthMonitor(): ISystemHealthMonitor | undefined;
}
//# sourceMappingURL=BaseMonitoringSystem.d.ts.map