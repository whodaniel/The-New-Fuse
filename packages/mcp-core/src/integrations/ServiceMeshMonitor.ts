/**
 * Service Mesh Monitor
 *
 * Provides comprehensive monitoring capabilities for MCP services in a service mesh,
 * including health monitoring, metrics collection, and performance tracking.
 */

import { EventEmitter } from 'events';
import { ServiceHealth } from '../types/broker';
import {
  ServiceMeshIntegrationResult,
  ServiceMeshMetrics,
  ServiceMeshProvider,
} from './MCPServiceMesh';

/**
 * Monitoring configuration
 */
export interface ServiceMeshMonitorConfig {
  /** Health check interval in seconds */
  healthCheckInterval: number;
  /** Metrics collection interval in seconds */
  metricsInterval: number;
  /** Health check timeout in milliseconds */
  healthCheckTimeout: number;
  /** Maximum number of consecutive failures before marking unhealthy */
  maxConsecutiveFailures: number;
  /** Enable detailed performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Enable alerting */
  enableAlerting: boolean;
  /** Alert thresholds */
  alertThresholds: AlertThresholds;
  /** Metrics retention period in seconds */
  metricsRetention: number;
}

/**
 * Alert thresholds configuration
 */
export interface AlertThresholds {
  /** CPU utilization threshold (0-1) */
  cpuThreshold: number;
  /** Memory utilization threshold (0-1) */
  memoryThreshold: number;
  /** Error rate threshold (0-1) */
  errorRateThreshold: number;
  /** Response time threshold in milliseconds */
  responseTimeThreshold: number;
  /** Minimum health score threshold (0-1) */
  healthScoreThreshold: number;
}

/**
 * Service monitoring data
 */
export interface ServiceMonitoringData {
  /** Service ID */
  serviceId: string;
  /** Current health status */
  health: ServiceHealth;
  /** Latest metrics */
  metrics: ServiceMeshMetrics;
  /** Historical metrics */
  metricsHistory: ServiceMeshMetrics[];
  /** Consecutive failure count */
  consecutiveFailures: number;
  /** Last successful health check */
  lastSuccessfulCheck: Date;
  /** Monitoring start time */
  monitoringStarted: Date;
  /** Alert status */
  alertStatus: AlertStatus;
}

/**
 * Alert status
 */
export interface AlertStatus {
  /** Whether service is in alert state */
  inAlert: boolean;
  /** Active alerts */
  activeAlerts: Alert[];
  /** Last alert time */
  lastAlertTime?: Date;
  /** Alert suppression until */
  suppressedUntil?: Date;
}

/**
 * Alert definition
 */
export interface Alert {
  /** Alert ID */
  id: string;
  /** Alert type */
  type: 'health' | 'performance' | 'availability' | 'resource';
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Alert message */
  message: string;
  /** Alert details */
  details: Record<string, any>;
  /** Alert timestamp */
  timestamp: Date;
  /** Metric that triggered the alert */
  triggerMetric?: {
    name: string;
    value: number;
    threshold: number;
  };
}

/**
 * Monitoring statistics
 */
export interface MonitoringStatistics {
  /** Total services monitored */
  totalServices: number;
  /** Healthy services count */
  healthyServices: number;
  /** Unhealthy services count */
  unhealthyServices: number;
  /** Services in alert state */
  servicesInAlert: number;
  /** Total health checks performed */
  totalHealthChecks: number;
  /** Failed health checks */
  failedHealthChecks: number;
  /** Average response time across all services */
  averageResponseTime: number;
  /** Total metrics collected */
  totalMetricsCollected: number;
  /** Monitoring uptime */
  monitoringUptime: number;
  /** Last statistics update */
  lastUpdate: Date;
}

/**
 * Service Mesh Monitor implementation
 */
export class ServiceMeshMonitor extends EventEmitter {
  private provider: ServiceMeshProvider;
  private config: ServiceMeshMonitorConfig;
  private monitoredServices: Map<string, ServiceMonitoringData> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  private isRunning = false;
  private statistics: MonitoringStatistics;

  constructor(provider: ServiceMeshProvider, config: ServiceMeshMonitorConfig) {
    super();
    this.provider = provider;
    this.config = config;
    this.statistics = this.initializeStatistics();
  }

  /**
   * Initialize monitoring statistics
   */
  private initializeStatistics(): MonitoringStatistics {
    return {
      totalServices: 0,
      healthyServices: 0,
      unhealthyServices: 0,
      servicesInAlert: 0,
      totalHealthChecks: 0,
      failedHealthChecks: 0,
      averageResponseTime: 0,
      totalMetricsCollected: 0,
      monitoringUptime: 0,
      lastUpdate: new Date(),
    };
  }

  /**
   * Start monitoring services
   */
  async startMonitoring(): Promise<ServiceMeshIntegrationResult> {
    try {
      if (this.isRunning) {
        return {
          success: false,
          message: 'Monitoring is already running',
        };
      }

      // Start health check monitoring
      this.healthCheckInterval = setInterval(
        () => this.performHealthChecks(),
        this.config.healthCheckInterval * 1000
      );

      // Start metrics collection
      this.metricsCollectionInterval = setInterval(
        () => this.collectMetrics(),
        this.config.metricsInterval * 1000
      );

      this.isRunning = true;
      this.emit('monitoring-started');

      return {
        success: true,
        message: 'Service mesh monitoring started successfully',
        metadata: {
          healthCheckInterval: this.config.healthCheckInterval,
          metricsInterval: this.config.metricsInterval,
          startTime: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start service mesh monitoring',
        error: {
          code: 'MONITORING_START_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Stop monitoring services
   */
  async stopMonitoring(): Promise<ServiceMeshIntegrationResult> {
    try {
      if (!this.isRunning) {
        return {
          success: false,
          message: 'Monitoring is not running',
        };
      }

      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = undefined;
      }

      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
        this.metricsCollectionInterval = undefined;
      }

      this.isRunning = false;
      this.emit('monitoring-stopped');

      return {
        success: true,
        message: 'Service mesh monitoring stopped successfully',
        metadata: {
          stopTime: new Date().toISOString(),
          totalUptime: Date.now() - this.statistics.lastUpdate.getTime(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to stop service mesh monitoring',
        error: {
          code: 'MONITORING_STOP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Add service to monitoring
   */
  async addService(serviceId: string): Promise<ServiceMeshIntegrationResult> {
    try {
      if (this.monitoredServices.has(serviceId)) {
        return {
          success: false,
          message: `Service ${serviceId} is already being monitored`,
        };
      }

      // Get initial health and metrics
      const health = await this.provider.getServiceHealth(serviceId);
      const metrics = await this.provider.getServiceMetrics(serviceId);

      // Create monitoring data
      const monitoringData: ServiceMonitoringData = {
        serviceId,
        health,
        metrics,
        metricsHistory: [metrics],
        consecutiveFailures: 0,
        lastSuccessfulCheck: new Date(),
        monitoringStarted: new Date(),
        alertStatus: {
          inAlert: false,
          activeAlerts: [],
        },
      };

      this.monitoredServices.set(serviceId, monitoringData);
      this.updateStatistics();
      this.emit('service-added', serviceId);

      return {
        success: true,
        message: `Service ${serviceId} added to monitoring`,
        metadata: {
          serviceId,
          initialHealth: health.status,
          initialHealthScore: health.score,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to add service ${serviceId} to monitoring`,
        error: {
          code: 'SERVICE_ADD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Remove service from monitoring
   */
  async removeService(serviceId: string): Promise<ServiceMeshIntegrationResult> {
    try {
      if (!this.monitoredServices.has(serviceId)) {
        return {
          success: false,
          message: `Service ${serviceId} is not being monitored`,
        };
      }

      this.monitoredServices.delete(serviceId);
      this.updateStatistics();
      this.emit('service-removed', serviceId);

      return {
        success: true,
        message: `Service ${serviceId} removed from monitoring`,
        metadata: {
          serviceId,
          removedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove service ${serviceId} from monitoring`,
        error: {
          code: 'SERVICE_REMOVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Get service monitoring data
   */
  getServiceMonitoringData(serviceId: string): ServiceMonitoringData | undefined {
    return this.monitoredServices.get(serviceId);
  }

  /**
   * Get all monitored services
   */
  getMonitoredServices(): string[] {
    return Array.from(this.monitoredServices.keys());
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): MonitoringStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Get services by health status
   */
  getServicesByHealthStatus(status: 'online' | 'offline' | 'degraded'): string[] {
    return Array.from(this.monitoredServices.entries())
      .filter(([_, data]) => data.health.status === status)
      .map(([serviceId]) => serviceId);
  }

  /**
   * Get services in alert state
   */
  getServicesInAlert(): Array<{ serviceId: string; alerts: Alert[] }> {
    return Array.from(this.monitoredServices.entries())
      .filter(([_, data]) => data.alertStatus.inAlert)
      .map(([serviceId, data]) => ({
        serviceId,
        alerts: data.alertStatus.activeAlerts,
      }));
  }

  /**
   * Perform health checks for all monitored services
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.monitoredServices.keys()).map((serviceId) =>
      this.performHealthCheck(serviceId)
    );

    await Promise.allSettled(healthCheckPromises);
    this.updateStatistics();
  }

  /**
   * Perform health check for a specific service
   */
  private async performHealthCheck(serviceId: string): Promise<void> {
    try {
      const monitoringData = this.monitoredServices.get(serviceId);
      if (!monitoringData) return;

      this.statistics.totalHealthChecks++;

      const health = await this.provider.getServiceHealth(serviceId);

      // Update monitoring data
      monitoringData.health = health;

      if (health.status === 'online') {
        monitoringData.consecutiveFailures = 0;
        monitoringData.lastSuccessfulCheck = new Date();
      } else {
        monitoringData.consecutiveFailures++;
        this.statistics.failedHealthChecks++;
      }

      // Check for alerts
      await this.checkHealthAlerts(serviceId, monitoringData);

      this.emit('health-check-completed', serviceId, health);
    } catch (error) {
      const monitoringData = this.monitoredServices.get(serviceId);
      if (monitoringData) {
        monitoringData.consecutiveFailures++;
        this.statistics.failedHealthChecks++;
      }

      this.emit('health-check-failed', serviceId, error);
    }
  }

  /**
   * Collect metrics for all monitored services
   */
  private async collectMetrics(): Promise<void> {
    const metricsPromises = Array.from(this.monitoredServices.keys()).map((serviceId) =>
      this.collectServiceMetrics(serviceId)
    );

    await Promise.allSettled(metricsPromises);
    this.updateStatistics();
  }

  /**
   * Collect metrics for a specific service
   */
  private async collectServiceMetrics(serviceId: string): Promise<void> {
    try {
      const monitoringData = this.monitoredServices.get(serviceId);
      if (!monitoringData) return;

      const metrics = await this.provider.getServiceMetrics(serviceId);

      // Update monitoring data
      monitoringData.metrics = metrics;
      monitoringData.metricsHistory.push(metrics);

      // Trim history to retention period
      const retentionCutoff = Date.now() - this.config.metricsRetention * 1000;
      monitoringData.metricsHistory = monitoringData.metricsHistory.filter(
        (m) => m.timestamp.getTime() > retentionCutoff
      );

      this.statistics.totalMetricsCollected++;

      // Check for performance alerts
      await this.checkPerformanceAlerts(serviceId, monitoringData);

      this.emit('metrics-collected', serviceId, metrics);
    } catch (error) {
      this.emit('metrics-collection-failed', serviceId, error);
    }
  }

  /**
   * Check for health-related alerts
   */
  private async checkHealthAlerts(
    serviceId: string,
    monitoringData: ServiceMonitoringData
  ): Promise<void> {
    const alerts: Alert[] = [];

    // Check consecutive failures
    if (monitoringData.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      alerts.push({
        id: `health-${serviceId}-${Date.now()}`,
        type: 'health',
        severity: 'critical',
        message: `Service ${serviceId} has failed ${monitoringData.consecutiveFailures} consecutive health checks`,
        details: {
          consecutiveFailures: monitoringData.consecutiveFailures,
          lastSuccessfulCheck: monitoringData.lastSuccessfulCheck,
          currentStatus: monitoringData.health.status,
        },
        timestamp: new Date(),
      });
    }

    // Check health score
    if (monitoringData.health.score < this.config.alertThresholds.healthScoreThreshold) {
      alerts.push({
        id: `health-score-${serviceId}-${Date.now()}`,
        type: 'health',
        severity: 'high',
        message: `Service ${serviceId} health score is below threshold`,
        details: {
          currentScore: monitoringData.health.score,
          threshold: this.config.alertThresholds.healthScoreThreshold,
        },
        timestamp: new Date(),
        triggerMetric: {
          name: 'health_score',
          value: monitoringData.health.score,
          threshold: this.config.alertThresholds.healthScoreThreshold,
        },
      });
    }

    if (alerts.length > 0) {
      this.processAlerts(serviceId, alerts);
    }
  }

  /**
   * Check for performance-related alerts
   */
  private async checkPerformanceAlerts(
    serviceId: string,
    monitoringData: ServiceMonitoringData
  ): Promise<void> {
    if (!this.config.enablePerformanceMonitoring) return;

    const alerts: Alert[] = [];
    const metrics = monitoringData.metrics;

    // Check CPU utilization
    if (metrics.resources.cpu > this.config.alertThresholds.cpuThreshold) {
      alerts.push({
        id: `cpu-${serviceId}-${Date.now()}`,
        type: 'resource',
        severity: 'medium',
        message: `Service ${serviceId} CPU utilization is above threshold`,
        details: {
          currentCPU: metrics.resources.cpu,
          threshold: this.config.alertThresholds.cpuThreshold,
        },
        timestamp: new Date(),
        triggerMetric: {
          name: 'cpu_utilization',
          value: metrics.resources.cpu,
          threshold: this.config.alertThresholds.cpuThreshold,
        },
      });
    }

    // Check memory utilization
    if (metrics.resources.memory > this.config.alertThresholds.memoryThreshold) {
      alerts.push({
        id: `memory-${serviceId}-${Date.now()}`,
        type: 'resource',
        severity: 'medium',
        message: `Service ${serviceId} memory utilization is above threshold`,
        details: {
          currentMemory: metrics.resources.memory,
          threshold: this.config.alertThresholds.memoryThreshold,
        },
        timestamp: new Date(),
        triggerMetric: {
          name: 'memory_utilization',
          value: metrics.resources.memory,
          threshold: this.config.alertThresholds.memoryThreshold,
        },
      });
    }

    // Check error rate
    const errorRate = metrics.requests.failed / metrics.requests.total;
    if (errorRate > this.config.alertThresholds.errorRateThreshold) {
      alerts.push({
        id: `error-rate-${serviceId}-${Date.now()}`,
        type: 'performance',
        severity: 'high',
        message: `Service ${serviceId} error rate is above threshold`,
        details: {
          currentErrorRate: errorRate,
          threshold: this.config.alertThresholds.errorRateThreshold,
          totalRequests: metrics.requests.total,
          failedRequests: metrics.requests.failed,
        },
        timestamp: new Date(),
        triggerMetric: {
          name: 'error_rate',
          value: errorRate,
          threshold: this.config.alertThresholds.errorRateThreshold,
        },
      });
    }

    // Check response time
    if (metrics.responseTime.average > this.config.alertThresholds.responseTimeThreshold) {
      alerts.push({
        id: `response-time-${serviceId}-${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        message: `Service ${serviceId} response time is above threshold`,
        details: {
          currentResponseTime: metrics.responseTime.average,
          threshold: this.config.alertThresholds.responseTimeThreshold,
        },
        timestamp: new Date(),
        triggerMetric: {
          name: 'response_time',
          value: metrics.responseTime.average,
          threshold: this.config.alertThresholds.responseTimeThreshold,
        },
      });
    }

    if (alerts.length > 0) {
      this.processAlerts(serviceId, alerts);
    }
  }

  /**
   * Process alerts for a service
   */
  private processAlerts(serviceId: string, alerts: Alert[]): void {
    const monitoringData = this.monitoredServices.get(serviceId);
    if (!monitoringData) return;

    // Update alert status
    monitoringData.alertStatus.inAlert = true;
    monitoringData.alertStatus.activeAlerts.push(...alerts);
    monitoringData.alertStatus.lastAlertTime = new Date();

    // Emit alert events
    alerts.forEach((alert) => {
      this.emit('alert', serviceId, alert);
    });

    this.emit('service-alert-status-changed', serviceId, monitoringData.alertStatus);
  }

  /**
   * Update monitoring statistics
   */
  private updateStatistics(): void {
    this.statistics.totalServices = this.monitoredServices.size;
    this.statistics.healthyServices = this.getServicesByHealthStatus('online').length;
    this.statistics.unhealthyServices =
      this.getServicesByHealthStatus('offline').length +
      this.getServicesByHealthStatus('degraded').length;
    this.statistics.servicesInAlert = this.getServicesInAlert().length;

    // Calculate average response time
    const responseTimes = Array.from(this.monitoredServices.values())
      .map((data) => data.metrics.responseTime.average)
      .filter((time) => time > 0);

    this.statistics.averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

    this.statistics.monitoringUptime = Date.now() - this.statistics.lastUpdate.getTime();
    this.statistics.lastUpdate = new Date();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopMonitoring();
    this.monitoredServices.clear();
    this.removeAllListeners();
  }
}
