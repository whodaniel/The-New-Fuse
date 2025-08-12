/**
 * @fileoverview Unified monitoring service that orchestrates all monitoring capabilities
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SystemMonitor } from './SystemMonitor';
import { MetricsCollector } from './MetricsCollector';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceMetrics, HealthStatus, Alert, AlertSeverity, AlertStatus } from '../types/monitoring';
import { ServiceState } from '../constants/types';
import { logger } from '../utils/logger';
import { BaseError } from '../utils/errors';

@Injectable()
export class UnifiedMonitoringService implements OnModuleInit, OnModuleDestroy {
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private alerts: Map<string, Alert> = new Map();
  private alertCallbacks: Array<(alert: Alert) => void> = [];

  constructor(): unknown {
    private readonly systemMonitor: SystemMonitor,
    private readonly metricsCollector: MetricsCollector,
    private readonly performanceMonitor: PerformanceMonitor
  ) {
    logger.setContext({ service: 'UnifiedMonitoringService' });
  }

  async onModuleInit(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      logger.warn('UnifiedMonitoringService is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      logger.info('Starting UnifiedMonitoringService');

      // Start all monitoring services
      await this.metricsCollector.start();
      await this.systemMonitor.start();
      await this.performanceMonitor.start();

      // Register system services for health monitoring
      this.systemMonitor.registerService('MetricsCollector');
      this.systemMonitor.registerService('PerformanceMonitor');

      this.state = ServiceState.RUNNING;
      logger.info('UnifiedMonitoringService started successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      logger.error('Failed to start UnifiedMonitoringService', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === ServiceState.STOPPED) {
      logger.warn('UnifiedMonitoringService is already stopped');
      return;
    }

    try {
      this.state = ServiceState.STOPPING;
      logger.info('Stopping UnifiedMonitoringService');

      // Stop all monitoring services
      await this.performanceMonitor.stop();
      await this.systemMonitor.stop();
      await this.metricsCollector.stop();

      this.state = ServiceState.STOPPED;
      logger.info('UnifiedMonitoringService stopped successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      logger.error('Failed to stop UnifiedMonitoringService', error as Error);
      throw error;
    }
  }

  getState(): ServiceState {
    return this.state;
  }

  // Monitoring methods
  async monitor(): Promise<PerformanceMetrics> {
    this.ensureRunning();
    return await this.performanceMonitor.monitor();
  }

  async getHealthStatus(): Promise<HealthStatus> {
    this.ensureRunning();
    return await this.systemMonitor.getHealthStatus();
  }

  // Metrics methods
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.ensureRunning();
    this.metricsCollector.recordGauge(name, value, 'units', tags, 'unified-monitoring');
  }

  recordCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.ensureRunning();
    this.metricsCollector.recordCounter(name, value, tags, 'unified-monitoring');
  }

  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    this.ensureRunning();
    this.metricsCollector.recordTimer(name, duration, tags, 'unified-monitoring');
  }

  // Error tracking
  captureError(error: Error, context?: Record<string, any>): void {
    this.ensureRunning();
    
    logger.error('Captured error', error, context);
    
    this.recordCounter('errors_total', 1, {
      error_type: error.name,
      error_message: error.message.substring(0, 100), // Truncate for tags
    });

    // Check if this error should trigger an alert
    this.checkErrorAlert(error, context);
  }

  // Service registration
  registerService(name: string, healthCheckUrl?: string): void {
    this.ensureRunning();
    this.systemMonitor.registerService(name, healthCheckUrl);
  }

  unregisterService(name: string): void {
    this.ensureRunning();
    this.systemMonitor.unregisterService(name);
  }

  // Request tracking
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.ensureRunning();
    this.performanceMonitor.recordRequest(responseTime, isError);
  }

  recordConnectionChange(delta: number): void {
    this.ensureRunning();
    this.performanceMonitor.recordConnectionChange(delta);
  }

  // Database monitoring
  recordDatabaseConnection(active: number, idle: number): void {
    this.ensureRunning();
    this.performanceMonitor.recordDatabaseConnection(active, idle);
  }

  // Alert management
  createAlert(): unknown {
    name: string,
    description: string,
    severity: AlertSeverity,
    condition: unknown;
      metric: string;
      operator: 'greater' | 'less' | 'equals' | 'not_equals';
      threshold: number;
      duration: number;
    }
  ): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      name,
      description,
      severity,
      status: AlertStatus.ACTIVE,
      condition,
      actions: [],
      createdAt: new Date(),
      metadata: {},
    };

    this.alerts.set(alertId, alert);
    logger.info('Created alert', { alertId, name, severity });
    
    return alertId;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    
    logger.info('Resolved alert', { alertId, name: alert.name });
    this.notifyAlertCallbacks(alert);
    
    return true;
  }

  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'ACTIVE');
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Performance tracking utilities
  async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    this.ensureRunning();
    return await this.performanceMonitor.trackOperation(operationName, operation, tags);
  }

  trackOperationSync<T>(
    operationName: string,
    operation: () => T,
    tags?: Record<string, string>
  ): T {
    this.ensureRunning();
    return this.performanceMonitor.trackOperationSync(operationName, operation, tags);
  }

  // Metrics summary
  getMetricsSummary(): Record<string, any> {
    this.ensureRunning();
    return this.metricsCollector.getMetricsSummary();
  }

  // System status
  async getSystemStatus(): Promise<{
    health: HealthStatus;
    performance: PerformanceMetrics;
    alerts: Alert[];
    metrics: Record<string, any>;
  }> {
    this.ensureRunning();
    
    const [health, performance, alerts, metrics] = await Promise.all([
      this.getHealthStatus(),
      this.monitor(),
      Promise.resolve(this.getActiveAlerts()),
      Promise.resolve(this.getMetricsSummary()),
    ]);

    return {
      health,
      performance,
      alerts,
      metrics,
    };
  }

  private ensureRunning(): void {
    if (this.state !== ServiceState.RUNNING) {
      throw new BaseError(): unknown {
        'UnifiedMonitoringService is not running',
        'SERVICE_NOT_RUNNING',
        { state: this.state }
      );
    }
  }

  private checkErrorAlert(error: Error, context?: Record<string, any>): void {
    // Simple error rate alerting
    const errorMetrics = this.metricsCollector.getMetricSeries('errors_total');
    if (!errorMetrics) return;

    const recentErrors = errorMetrics.dataPoints.filter(
      dp => dp.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    if (recentErrors.length > 10) { // More than 10 errors in 5 minutes
      const alertId = this.createAlert(
        'High Error Rate',
        `High error rate detected: ${recentErrors.length} errors in the last 5 minutes`,
        AlertSeverity.WARNING,
        {
          metric: 'errors_total',
          operator: 'greater',
          threshold: 10,
          duration: 300, // 5 minutes
        }
      );

      const alert = this.alerts.get(alertId);
      if (alert) {
        this.notifyAlertCallbacks(alert);
      }
    }
  }

  private notifyAlertCallbacks(alert: Alert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Error in alert callback', error as Error, { alertId: alert.id });
      }
    });
  }
}