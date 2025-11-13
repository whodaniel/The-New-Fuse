/**
 * Comprehensive MCP Monitoring System
 */
import { EventEmitter } from 'events';
import { IMonitoringSystem, IMetricsCollector, IAlertManager, IDashboardManager, IPerformanceMonitor, ILoadTester, ICacheMonitor, IConnectionPoolMonitor, ISystemHealthMonitor } from '../interfaces/IMonitoring';
import { MonitoringConfig } from '../types/monitoring';
import { Logger } from '../utils/Logger';
/**
 * Main monitoring system implementation
 */
export declare class MonitoringSystem extends EventEmitter implements IMonitoringSystem {
    private readonly logger;
    private config?;
    private running;
    private startTime?;
    private metricsCollector?;
    private alertManager?;
    private dashboardManager?;
    private performanceMonitor?;
    private loadTester?;
    private cacheMonitor?;
    private connectionPoolMonitor?;
    private systemHealthMonitor?;
    constructor(logger?: Logger);
    /**
     * Initialize monitoring system
     */
    initialize(config: MonitoringConfig): Promise<void>;
    /**
     * Shutdown monitoring system
     */
    shutdown(): Promise<void>;
    /**
     * Get metrics collector
     */
    getMetricsCollector(): IMetricsCollector;
    /**
     * Get alert manager
     */
    getAlertManager(): IAlertManager;
    /**
     * Get dashboard manager
     */
    getDashboardManager(): IDashboardManager;
    /**
     * Get performance monitor
     */
    getPerformanceMonitor(): IPerformanceMonitor;
    /**
     * Get load tester
     */
    getLoadTester(): ILoadTester;
    /**
     * Get cache monitor
     */
    getCacheMonitor(): ICacheMonitor;
    /**
     * Get connection pool monitor
     */
    getConnectionPoolMonitor(): IConnectionPoolMonitor;
    /**
     * Get system health monitor
     */
    getSystemHealthMonitor(): ISystemHealthMonitor;
    /**
     * Export metrics
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
     * Initialize all components
     */
    private initializeComponents;
    /**
     * Start all components
     */
    private startComponents;
    /**
     * Stop all components
     */
    private stopComponents;
    /**
     * Set up event forwarding from components
     */
    private setupEventForwarding;
    /**
     * Format metrics for Prometheus export
     */
    private formatPrometheusMetrics;
}
//# sourceMappingURL=MonitoringSystem.d.ts.map