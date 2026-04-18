/**
 * Comprehensive MCP Monitoring System
 */

import { EventEmitter } from 'events';
import {
  IMonitoringSystem,
  IMetricsCollector,
  IAlertManager,
  IDashboardManager,
  IPerformanceMonitor,
  ILoadTester,
  ICacheMonitor,
  IConnectionPoolMonitor,
  ISystemHealthMonitor
} from '../interfaces/IMonitoring';
import { MonitoringConfig } from '../types/monitoring';
import { Logger } from '../utils/Logger';
import { MetricsCollector } from './MetricsCollector';
import { AlertManager } from './AlertManager';
import { DashboardManager } from './DashboardManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { LoadTester } from './LoadTester';
import { CacheMonitor } from './CacheMonitor';
import { ConnectionPoolMonitor } from './ConnectionPoolMonitor';
import { SystemHealthMonitor } from './SystemHealthMonitor';

/**
 * Main monitoring system implementation
 */
export class MonitoringSystem extends EventEmitter implements IMonitoringSystem {
  private readonly logger: Logger;
  private config?: MonitoringConfig;
  private running = false;
  private startTime?: Date;

  // Component instances
  private metricsCollector?: MetricsCollector;
  private alertManager?: AlertManager;
  private dashboardManager?: DashboardManager;
  private performanceMonitor?: PerformanceMonitor;
  private loadTester?: LoadTester;
  private cacheMonitor?: CacheMonitor;
  private connectionPoolMonitor?: ConnectionPoolMonitor;
  private systemHealthMonitor?: SystemHealthMonitor;

  constructor(logger?: Logger) {
    super();
    this.logger = logger || new Logger('MonitoringSystem');
  }

  /**
   * Initialize monitoring system
   */
  async initialize(config: MonitoringConfig): Promise<void> {
    try {
      this.config = config;
      this.logger.info('Initializing monitoring system', { config });

      if (!config.enabled) {
        this.logger.info('Monitoring is disabled');
        return;
      }

      // Initialize components
      await this.initializeComponents();

      // Start components
      await this.startComponents();

      this.running = true;
      this.startTime = new Date();

      this.logger.info('Monitoring system initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize monitoring system:', error);
      throw error;
    }
  }

  /**
   * Shutdown monitoring system
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down monitoring system');

      if (!this.running) {
        this.logger.warn('Monitoring system is not running');
        return;
      }

      // Stop components
      await this.stopComponents();

      this.running = false;
      this.startTime = undefined;

      this.logger.info('Monitoring system shutdown complete');
      this.emit('shutdown');
    } catch (error) {
      this.logger.error('Error during monitoring system shutdown:', error);
      throw error;
    }
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector(): IMetricsCollector {
    if (!this.metricsCollector) {
      throw new Error('Monitoring system not initialized');
    }
    return this.metricsCollector;
  }

  /**
   * Get alert manager
   */
  getAlertManager(): IAlertManager {
    if (!this.alertManager) {
      throw new Error('Monitoring system not initialized');
    }
    return this.alertManager;
  }

  /**
   * Get dashboard manager
   */
  getDashboardManager(): IDashboardManager {
    if (!this.dashboardManager) {
      throw new Error('Monitoring system not initialized');
    }
    return this.dashboardManager;
  }

  /**
   * Get performance monitor
   */
  getPerformanceMonitor(): IPerformanceMonitor {
    if (!this.performanceMonitor) {
      throw new Error('Monitoring system not initialized');
    }
    return this.performanceMonitor;
  }

  /**
   * Get load tester
   */
  getLoadTester(): ILoadTester {
    if (!this.loadTester) {
      throw new Error('Monitoring system not initialized');
    }
    return this.loadTester;
  }

  /**
   * Get cache monitor
   */
  getCacheMonitor(): ICacheMonitor {
    if (!this.cacheMonitor) {
      throw new Error('Monitoring system not initialized');
    }
    return this.cacheMonitor;
  }

  /**
   * Get connection pool monitor
   */
  getConnectionPoolMonitor(): IConnectionPoolMonitor {
    if (!this.connectionPoolMonitor) {
      throw new Error('Monitoring system not initialized');
    }
    return this.connectionPoolMonitor;
  }

  /**
   * Get system health monitor
   */
  getSystemHealthMonitor(): ISystemHealthMonitor {
    if (!this.systemHealthMonitor) {
      throw new Error('Monitoring system not initialized');
    }
    return this.systemHealthMonitor;
  }

  /**
   * Export metrics
   */
  async exportMetrics(format: 'prometheus' | 'json'): Promise<string> {
    if (!this.metricsCollector) {
      throw new Error('Monitoring system not initialized');
    }

    const metrics = this.metricsCollector.getCurrentMetrics();

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }

    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(metrics);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Get monitoring status
   */
  async getStatus(): Promise<{
    running: boolean;
    uptime: number;
    components: Record<string, boolean>;
  }> {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;

    const components: Record<string, boolean> = {
      metricsCollector: !!this.metricsCollector,
      alertManager: !!this.alertManager,
      dashboardManager: !!this.dashboardManager,
      performanceMonitor: !!this.performanceMonitor,
      loadTester: !!this.loadTester,
      cacheMonitor: !!this.cacheMonitor,
      connectionPoolMonitor: !!this.connectionPoolMonitor,
      systemHealthMonitor: !!this.systemHealthMonitor
    };

    return {
      running: this.running,
      uptime,
      components
    };
  }

  /**
   * Initialize all components
   */
  private async initializeComponents(): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not set');
    }

    // Initialize metrics collector
    this.metricsCollector = new MetricsCollector({
      interval: this.config.metricsInterval,
      retentionPeriod: this.config.retentionPeriod,
      storage: this.config.storage
    }, this.logger);

    // Initialize alert manager
    if (this.config.enableAlerting) {
      this.alertManager = new AlertManager({
        checkInterval: this.config.alertInterval,
        retentionPeriod: this.config.retentionPeriod
      }, this.logger);
    }

    // Initialize dashboard manager
    if (this.config.enableDashboards) {
      this.dashboardManager = new DashboardManager({
        refreshInterval: this.config.dashboardRefreshInterval,
        storage: this.config.storage
      }, this.logger);
    }

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor({
      metricsInterval: this.config.metricsInterval,
      retentionPeriod: this.config.retentionPeriod
    }, this.logger);

    // Initialize load tester
    this.loadTester = new LoadTester(this.logger);

    // Initialize cache monitor
    this.cacheMonitor = new CacheMonitor({
      retentionPeriod: this.config.retentionPeriod
    }, this.logger);

    // Initialize connection pool monitor
    this.connectionPoolMonitor = new ConnectionPoolMonitor({
      retentionPeriod: this.config.retentionPeriod
    }, this.logger);

    // Initialize system health monitor
    this.systemHealthMonitor = new SystemHealthMonitor({
      checkInterval: 30000, // 30 seconds
      timeout: 5000 // 5 seconds
    }, this.logger);

    this.logger.debug('All monitoring components initialized');
  }

  /**
   * Start all components
   */
  private async startComponents(): Promise<void> {
    const startPromises: Promise<void>[] = [];

    if (this.metricsCollector) {
      startPromises.push(this.metricsCollector.start());
    }

    if (this.performanceMonitor) {
      startPromises.push(this.performanceMonitor.start());
    }

    await Promise.all(startPromises);

    // Set up component event forwarding
    this.setupEventForwarding();

    this.logger.debug('All monitoring components started');
  }

  /**
   * Stop all components
   */
  private async stopComponents(): Promise<void> {
    const stopPromises: Promise<void>[] = [];

    if (this.metricsCollector) {
      stopPromises.push(this.metricsCollector.stop());
    }

    if (this.performanceMonitor) {
      stopPromises.push(this.performanceMonitor.stop());
    }

    await Promise.all(stopPromises);

    this.logger.debug('All monitoring components stopped');
  }

  /**
   * Set up event forwarding from components
   */
  private setupEventForwarding(): void {
    // Forward metrics events
    if (this.metricsCollector) {
      this.metricsCollector.on('metricsCollected', (metrics) => {
        this.emit('metricsCollected', metrics);
      });
    }

    // Forward alert events
    if (this.alertManager) {
      this.alertManager.on('alertTriggered', (alert) => {
        this.emit('alertTriggered', alert);
      });

      this.alertManager.on('alertResolved', (alert) => {
        this.emit('alertResolved', alert);
      });
    }

    // Forward performance events
    if (this.performanceMonitor) {
      this.performanceMonitor.on('performanceUpdate', (metrics) => {
        this.emit('performanceUpdate', metrics);
      });

      this.performanceMonitor.on('performanceAlert', (alert) => {
        this.emit('performanceAlert', alert);
      });
    }

    // Forward health events
    if (this.systemHealthMonitor) {
      this.systemHealthMonitor.on('healthStatusChanged', (status) => {
        this.emit('healthStatusChanged', status);
      });
    }
  }

  /**
   * Format metrics for Prometheus export
   */
  private formatPrometheusMetrics(metrics: any): string {
    const lines: string[] = [];

    // Helper function to add metric
    const addMetric = (name: string, value: number, labels?: Record<string, string>) => {
      const labelStr = labels ? 
        `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : '';
      lines.push(`mcp_${name}${labelStr} ${value}`);
    };

    // Request metrics
    addMetric('requests_total', metrics.requests.total);
    addMetric('requests_successful', metrics.requests.successful);
    addMetric('requests_failed', metrics.requests.failed);
    addMetric('requests_per_second', metrics.requests.rps);
    addMetric('response_time_avg_ms', metrics.requests.avgResponseTime);
    addMetric('response_time_p95_ms', metrics.requests.p95ResponseTime);
    addMetric('response_time_p99_ms', metrics.requests.p99ResponseTime);

    // Connection metrics
    addMetric('connections_active', metrics.connections.active);
    addMetric('connections_total', metrics.connections.total);
    addMetric('connections_failed', metrics.connections.failed);
    addMetric('connection_time_avg_ms', metrics.connections.avgConnectionTime);

    // Resource metrics
    addMetric('resources_total', metrics.resources.total);
    addMetric('resource_access_count', metrics.resources.accessCount);
    addMetric('resource_cache_hit_rate', metrics.resources.cacheHitRate);
    addMetric('resource_read_time_avg_ms', metrics.resources.avgReadTime);

    // Tool metrics
    addMetric('tools_total', metrics.tools.total);
    addMetric('tool_execution_count', metrics.tools.executionCount);
    addMetric('tool_execution_time_avg_ms', metrics.tools.avgExecutionTime);
    addMetric('tool_success_rate', metrics.tools.successRate);

    // System metrics
    addMetric('memory_usage_bytes', metrics.system.memoryUsage);
    addMetric('cpu_usage_percent', metrics.system.cpuUsage);
    addMetric('uptime_ms', metrics.system.uptime);
    addMetric('health_score', metrics.system.healthScore);

    return lines.join('\n');
  }
}