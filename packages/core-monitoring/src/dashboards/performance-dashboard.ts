/**
 * Performance Dashboard
 * Real-time performance monitoring dashboard data provider
 */

import type { WebVitalsMetric } from '../performance/web-vitals.js';
import type { QueryMetric, ConnectionPoolMetric } from '../performance/db-monitoring.js';
import type { Transaction } from '../performance/apm.js';

export interface DashboardMetrics {
  timestamp: number;
  frontend: FrontendMetrics;
  backend: BackendMetrics;
  database: DatabaseMetrics;
  infrastructure: InfrastructureMetrics;
}

export interface FrontendMetrics {
  webVitals: {
    fcp: MetricValue;
    lcp: MetricValue;
    fid: MetricValue;
    cls: MetricValue;
    ttfb: MetricValue;
    inp: MetricValue;
  };
  bundleSize: {
    total: number;
    js: number;
    css: number;
    images: number;
  };
  loadTime: {
    total: number;
    domInteractive: number;
    domComplete: number;
  };
  resourceCount: {
    total: number;
    scripts: number;
    stylesheets: number;
    images: number;
  };
}

export interface BackendMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  };
  latency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  activeTransactions: number;
  errors: {
    total: number;
    rate: number;
  };
}

export interface DatabaseMetrics {
  queries: {
    total: number;
    slow: number;
    failed: number;
    avgDuration: number;
  };
  connectionPool: {
    total: number;
    active: number;
    idle: number;
    utilization: number;
  };
  topQueries: QueryPattern[];
}

export interface InfrastructureMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    utilization: number;
  };
  disk: {
    used: number;
    total: number;
    utilization: number;
  };
}

export interface MetricValue {
  current: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface QueryPattern {
  pattern: string;
  count: number;
  avgDuration: number;
}

export interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'frontend' | 'backend' | 'database' | 'infrastructure';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class PerformanceDashboard {
  private metricsHistory: DashboardMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private maxHistorySize = 1000;

  /**
   * Add metrics to dashboard
   */
  addMetrics(metrics: DashboardMetrics): void {
    this.metricsHistory.push(metrics);

    // Keep only recent history
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }

    // Check for alerts
    this.checkAlerts(metrics);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): DashboardMetrics | null {
    if (this.metricsHistory.length === 0) {
      return null;
    }

    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(duration: number = 3600000): DashboardMetrics[] {
    const now = Date.now();
    const cutoff = now - duration;

    return this.metricsHistory.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get time series data for a metric
   */
  getTimeSeries(
    category: keyof DashboardMetrics,
    metric: string,
    duration: number = 3600000
  ): Array<{ timestamp: number; value: number }> {
    const history = this.getMetricsHistory(duration);

    return history.map(m => ({
      timestamp: m.timestamp,
      value: this.getNestedValue(m[category], metric),
    }));
  }

  /**
   * Get active alerts
   */
  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    let alerts = this.alerts;

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    overall: 'good' | 'degraded' | 'poor';
    frontend: 'good' | 'degraded' | 'poor';
    backend: 'good' | 'degraded' | 'poor';
    database: 'good' | 'degraded' | 'poor';
    criticalAlerts: number;
    warningAlerts: number;
  } {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        overall: 'good',
        frontend: 'good',
        backend: 'good',
        database: 'good',
        criticalAlerts: 0,
        warningAlerts: 0,
      };
    }

    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning').length;

    // Determine component health
    const frontend = this.evaluateFrontendHealth(current.frontend);
    const backend = this.evaluateBackendHealth(current.backend);
    const database = this.evaluateDatabaseHealth(current.database);

    // Overall health is worst of all components
    const overall = this.getWorstHealth([frontend, backend, database]);

    return {
      overall,
      frontend,
      backend,
      database,
      criticalAlerts,
      warningAlerts,
    };
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: DashboardMetrics): void {
    // Frontend alerts
    this.checkWebVitalsAlerts(metrics.frontend.webVitals, metrics.timestamp);

    // Backend alerts
    this.checkBackendAlerts(metrics.backend, metrics.timestamp);

    // Database alerts
    this.checkDatabaseAlerts(metrics.database, metrics.timestamp);

    // Infrastructure alerts
    this.checkInfrastructureAlerts(metrics.infrastructure, metrics.timestamp);

    // Remove old alerts (older than 1 hour)
    const cutoff = Date.now() - 3600000;
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Check Web Vitals alerts
   */
  private checkWebVitalsAlerts(webVitals: FrontendMetrics['webVitals'], timestamp: number): void {
    const vitals = [
      { name: 'FCP', value: webVitals.fcp, threshold: 1800 },
      { name: 'LCP', value: webVitals.lcp, threshold: 2500 },
      { name: 'FID', value: webVitals.fid, threshold: 100 },
      { name: 'CLS', value: webVitals.cls, threshold: 0.1 },
      { name: 'TTFB', value: webVitals.ttfb, threshold: 800 },
      { name: 'INP', value: webVitals.inp, threshold: 200 },
    ];

    for (const vital of vitals) {
      if (vital.value.rating === 'poor') {
        this.addAlert({
          severity: 'critical',
          category: 'frontend',
          message: `${vital.name} is in poor range`,
          metric: vital.name,
          value: vital.value.current,
          threshold: vital.threshold,
          timestamp,
        });
      } else if (vital.value.rating === 'needs-improvement') {
        this.addAlert({
          severity: 'warning',
          category: 'frontend',
          message: `${vital.name} needs improvement`,
          metric: vital.name,
          value: vital.value.current,
          threshold: vital.threshold,
          timestamp,
        });
      }
    }
  }

  /**
   * Check backend alerts
   */
  private checkBackendAlerts(backend: BackendMetrics, timestamp: number): void {
    // High error rate
    if (backend.errors.rate > 0.05) {
      this.addAlert({
        severity: 'critical',
        category: 'backend',
        message: 'High error rate detected',
        metric: 'error_rate',
        value: backend.errors.rate,
        threshold: 0.05,
        timestamp,
      });
    }

    // High latency
    if (backend.latency.p95 > 1000) {
      this.addAlert({
        severity: 'warning',
        category: 'backend',
        message: 'High P95 latency detected',
        metric: 'p95_latency',
        value: backend.latency.p95,
        threshold: 1000,
        timestamp,
      });
    }
  }

  /**
   * Check database alerts
   */
  private checkDatabaseAlerts(database: DatabaseMetrics, timestamp: number): void {
    // High pool utilization
    if (database.connectionPool.utilization > 90) {
      this.addAlert({
        severity: 'critical',
        category: 'database',
        message: 'High database connection pool utilization',
        metric: 'pool_utilization',
        value: database.connectionPool.utilization,
        threshold: 90,
        timestamp,
      });
    }

    // Many slow queries
    const slowQueryRate = database.queries.total > 0
      ? database.queries.slow / database.queries.total
      : 0;

    if (slowQueryRate > 0.1) {
      this.addAlert({
        severity: 'warning',
        category: 'database',
        message: 'High slow query rate detected',
        metric: 'slow_query_rate',
        value: slowQueryRate,
        threshold: 0.1,
        timestamp,
      });
    }
  }

  /**
   * Check infrastructure alerts
   */
  private checkInfrastructureAlerts(
    infrastructure: InfrastructureMetrics,
    timestamp: number
  ): void {
    // High CPU usage
    if (infrastructure.cpu.usage > 85) {
      this.addAlert({
        severity: 'critical',
        category: 'infrastructure',
        message: 'High CPU usage detected',
        metric: 'cpu_usage',
        value: infrastructure.cpu.usage,
        threshold: 85,
        timestamp,
      });
    }

    // High memory usage
    if (infrastructure.memory.utilization > 90) {
      this.addAlert({
        severity: 'critical',
        category: 'infrastructure',
        message: 'High memory usage detected',
        metric: 'memory_utilization',
        value: infrastructure.memory.utilization,
        threshold: 90,
        timestamp,
      });
    }
  }

  /**
   * Add alert
   */
  private addAlert(alert: Omit<PerformanceAlert, 'id'>): void {
    // Check if similar alert already exists
    const exists = this.alerts.some(
      a =>
        a.metric === alert.metric &&
        a.category === alert.category &&
        a.timestamp > Date.now() - 300000 // Within 5 minutes
    );

    if (!exists) {
      this.alerts.push({
        id: this.generateId(),
        ...alert,
      });
    }
  }

  /**
   * Evaluate frontend health
   */
  private evaluateFrontendHealth(frontend: FrontendMetrics): 'good' | 'degraded' | 'poor' {
    const vitals = Object.values(frontend.webVitals);
    const poorCount = vitals.filter(v => v.rating === 'poor').length;
    const needsImprovementCount = vitals.filter(v => v.rating === 'needs-improvement').length;

    if (poorCount > 2) return 'poor';
    if (poorCount > 0 || needsImprovementCount > 3) return 'degraded';
    return 'good';
  }

  /**
   * Evaluate backend health
   */
  private evaluateBackendHealth(backend: BackendMetrics): 'good' | 'degraded' | 'poor' {
    if (backend.errors.rate > 0.05 || backend.latency.p95 > 2000) return 'poor';
    if (backend.errors.rate > 0.01 || backend.latency.p95 > 1000) return 'degraded';
    return 'good';
  }

  /**
   * Evaluate database health
   */
  private evaluateDatabaseHealth(database: DatabaseMetrics): 'good' | 'degraded' | 'poor' {
    const poolUtil = database.connectionPool.utilization;
    const slowQueryRate = database.queries.total > 0
      ? database.queries.slow / database.queries.total
      : 0;

    if (poolUtil > 90 || slowQueryRate > 0.2) return 'poor';
    if (poolUtil > 75 || slowQueryRate > 0.1) return 'degraded';
    return 'good';
  }

  /**
   * Get worst health status
   */
  private getWorstHealth(
    statuses: Array<'good' | 'degraded' | 'poor'>
  ): 'good' | 'degraded' | 'poor' {
    if (statuses.includes('poor')) return 'poor';
    if (statuses.includes('degraded')) return 'degraded';
    return 'good';
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): number {
    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return 0;
      }
    }

    return typeof value === 'number' ? value : 0;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const performanceDashboard = new PerformanceDashboard();
