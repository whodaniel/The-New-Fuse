/**
 * Base monitoring system implementation
 * Provides common functionality that can be extended by specific monitoring systems
 */

import { EventEmitter } from 'events';
import { 
  IMonitoringSystem, 
  IMetricsCollector, 
  IAlertManager,
  IPerformanceMonitor,
  IDashboardManager,
  ISystemHealthMonitor
} from '../interfaces/IMonitoring';
import { BaseMetricsCollector } from './BaseMetricsCollector';
import { Logger } from '../utils/Logger';

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
export abstract class BaseMonitoringSystem<TMetrics = any, TConfig extends BaseMonitoringConfig = BaseMonitoringConfig> 
  extends EventEmitter implements IMonitoringSystem<TMetrics, TConfig> {
  
  protected readonly logger: Logger;
  protected config?: TConfig;
  protected running = false;
  protected startTime?: Date;

  // Component instances
  protected metricsCollector?: IMetricsCollector<TMetrics>;
  protected alertManager?: IAlertManager;
  protected performanceMonitor?: IPerformanceMonitor;
  protected dashboardManager?: IDashboardManager;
  protected systemHealthMonitor?: ISystemHealthMonitor;

  constructor(logger?: Logger) {
    super();
    this.logger = logger || new Logger('BaseMonitoringSystem');
  }

  /**
   * Initialize monitoring system
   */
  async initialize(config: TConfig): Promise<void> {
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
  getMetricsCollector(): IMetricsCollector<TMetrics> {
    if (!this.metricsCollector) {
      throw new Error('Monitoring system not initialized');
    }
    return this.metricsCollector;
  }

  /**
   * Export metrics in specified format
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
      performanceMonitor: !!this.performanceMonitor,
      dashboardManager: !!this.dashboardManager,
      systemHealthMonitor: !!this.systemHealthMonitor
    };

    return {
      running: this.running,
      uptime,
      components
    };
  }

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
  protected async initializeComponents(): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not set');
    }

    // Initialize metrics collector (required)
    this.metricsCollector = this.createMetricsCollector();

    // Initialize optional components
    if (this.config.enableAlerting) {
      this.alertManager = this.createAlertManager();
    }

    if (this.config.enableDashboards) {
      this.dashboardManager = this.createDashboardManager();
    }

    // Initialize performance monitor
    this.performanceMonitor = this.createPerformanceMonitor();

    // Initialize system health monitor
    this.systemHealthMonitor = this.createSystemHealthMonitor();

    this.logger.debug('All monitoring components initialized');
  }

  /**
   * Start all components
   */
  protected async startComponents(): Promise<void> {
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
  protected async stopComponents(): Promise<void> {
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
  protected setupEventForwarding(): void {
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
    }

    // Forward health events
    if (this.systemHealthMonitor) {
      this.systemHealthMonitor.on('healthStatusChanged', (status) => {
        this.emit('healthStatusChanged', status);
      });
    }
  }

  /**
   * Create alert manager - can be overridden by subclasses
   */
  protected createAlertManager(): IAlertManager | undefined {
    // Default implementation - subclasses can override
    return undefined;
  }

  /**
   * Create dashboard manager - can be overridden by subclasses
   */
  protected createDashboardManager(): IDashboardManager | undefined {
    // Default implementation - subclasses can override
    return undefined;
  }

  /**
   * Create performance monitor - can be overridden by subclasses
   */
  protected createPerformanceMonitor(): IPerformanceMonitor | undefined {
    // Default implementation - subclasses can override
    return undefined;
  }

  /**
   * Create system health monitor - can be overridden by subclasses
   */
  protected createSystemHealthMonitor(): ISystemHealthMonitor | undefined {
    // Default implementation - subclasses can override
    return undefined;
  }
}