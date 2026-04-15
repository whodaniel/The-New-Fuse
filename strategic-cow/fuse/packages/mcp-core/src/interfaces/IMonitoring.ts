/**
 * Monitoring system interfaces
 */

import { EventEmitter } from 'events';
import {
  PerformanceMetrics,
  Alert,
  AlertSeverity,
  AlertStatus,
  TimeSeries,
  DashboardConfig,
  MonitoringConfig,
  LoadTestConfig,
  LoadTestResult,
  CacheMetrics,
  ConnectionPoolMetrics
} from '../types/monitoring';
import { ErrorStatistics } from '../types/error';

/**
 * Metrics collector interface
 */
export interface IMetricsCollector {
  /** Start collecting metrics */
  start(): Promise<void>;
  
  /** Stop collecting metrics */
  stop(): Promise<void>;
  
  /** Record a metric value */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void;
  
  /** Increment a counter metric */
  incrementCounter(name: string, labels?: Record<string, string>): void;
  
  /** Record a histogram value */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  
  /** Record a gauge value */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;
  
  /** Get current metrics */
  getCurrentMetrics(): PerformanceMetrics;
  
  /** Get metrics history */
  getMetricsHistory(hours: number): TimeSeries[];
  
  /** Get specific metric */
  getMetric(name: string): TimeSeries | null;
}

/**
 * Alert manager interface
 */
export interface IAlertManager {
  /** Register an alert rule */
  registerAlertRule(rule: AlertRule): void;
  
  /** Remove an alert rule */
  removeAlertRule(name: string): boolean;
  
  /** Get all alert rules */
  getAlertRules(): AlertRule[];
  
  /** Get active alerts */
  getActiveAlerts(): Alert[];
  
  /** Get alert history */
  getAlertHistory(hours: number): Alert[];
  
  /** Acknowledge an alert */
  acknowledgeAlert(alertId: string, user: string): Promise<void>;
  
  /** Resolve an alert */
  resolveAlert(alertId: string): Promise<void>;
  
  /** Suppress an alert */
  suppressAlert(alertId: string, duration: number): Promise<void>;
}

/**
 * Alert rule interface
 */
export interface AlertRule {
  /** Rule name */
  name: string;
  
  /** Rule description */
  description: string;
  
  /** Alert severity */
  severity: AlertSeverity;
  
  /** Rule condition */
  condition: (metrics: PerformanceMetrics, statistics: ErrorStatistics) => boolean;
  
  /** Alert cooldown period (ms) */
  cooldown: number;
  
  /** Last triggered timestamp */
  lastTriggered?: Date;
  
  /** Alert action */
  action: (alert: Alert) => Promise<void>;
  
  /** Rule enabled */
  enabled: boolean;
}

/**
 * Dashboard manager interface
 */
export interface IDashboardManager {
  /** Create a dashboard */
  createDashboard(config: DashboardConfig): Promise<void>;
  
  /** Update a dashboard */
  updateDashboard(id: string, config: Partial<DashboardConfig>): Promise<void>;
  
  /** Delete a dashboard */
  deleteDashboard(id: string): Promise<void>;
  
  /** Get dashboard */
  getDashboard(id: string): Promise<DashboardConfig | null>;
  
  /** List all dashboards */
  listDashboards(): Promise<DashboardConfig[]>;
  
  /** Get dashboard data */
  getDashboardData(id: string): Promise<any>;
  
  /** Export dashboard */
  exportDashboard(id: string): Promise<string>;
  
  /** Import dashboard */
  importDashboard(data: string): Promise<void>;
}

/**
 * Performance monitor interface
 */
export interface IPerformanceMonitor extends EventEmitter {
  /** Start monitoring */
  start(): Promise<void>;
  
  /** Stop monitoring */
  stop(): Promise<void>;
  
  /** Record request start */
  recordRequestStart(requestId: string): void;
  
  /** Record request end */
  recordRequestEnd(requestId: string, success: boolean): void;
  
  /** Record connection event */
  recordConnection(event: 'connect' | 'disconnect' | 'error'): void;
  
  /** Record resource access */
  recordResourceAccess(uri: string, duration: number, cached: boolean): void;
  
  /** Record tool execution */
  recordToolExecution(name: string, duration: number, success: boolean): void;
  
  /** Get current performance metrics */
  getCurrentMetrics(): PerformanceMetrics;
  
  /** Get performance history */
  getPerformanceHistory(hours: number): PerformanceMetrics[];
  
  /** Generate performance report */
  generateReport(timeWindow: number): Promise<PerformanceReport>;
}

/**
 * Performance report interface
 */
export interface PerformanceReport {
  /** Report period */
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  
  /** Summary metrics */
  summary: PerformanceMetrics;
  
  /** Performance trends */
  trends: {
    responseTime: 'improving' | 'degrading' | 'stable';
    throughput: 'improving' | 'degrading' | 'stable';
    errorRate: 'improving' | 'degrading' | 'stable';
    availability: 'improving' | 'degrading' | 'stable';
  };
  
  /** Top issues */
  issues: Array<{
    type: string;
    description: string;
    severity: AlertSeverity;
    impact: string;
    recommendation: string;
  }>;
  
  /** Recommendations */
  recommendations: string[];
}

/**
 * Load tester interface
 */
export interface ILoadTester {
  /** Run a load test */
  runLoadTest(config: LoadTestConfig): Promise<LoadTestResult>;
  
  /** Get running tests */
  getRunningTests(): LoadTestConfig[];
  
  /** Stop a running test */
  stopTest(testName: string): Promise<void>;
  
  /** Get test history */
  getTestHistory(): LoadTestResult[];
  
  /** Generate load test report */
  generateTestReport(result: LoadTestResult): Promise<string>;
}

/**
 * Cache monitor interface
 */
export interface ICacheMonitor {
  /** Record cache hit */
  recordCacheHit(key: string, accessTime: number): void;
  
  /** Record cache miss */
  recordCacheMiss(key: string, accessTime: number): void;
  
  /** Record cache eviction */
  recordCacheEviction(key: string, reason: string): void;
  
  /** Get cache metrics */
  getCacheMetrics(): CacheMetrics;
  
  /** Get cache statistics */
  getCacheStatistics(hours: number): CacheMetrics[];
}

/**
 * Connection pool monitor interface
 */
export interface IConnectionPoolMonitor {
  /** Record connection creation */
  recordConnectionCreated(): void;
  
  /** Record connection destruction */
  recordConnectionDestroyed(lifetime: number): void;
  
  /** Record connection acquisition */
  recordConnectionAcquired(waitTime: number): void;
  
  /** Record connection release */
  recordConnectionReleased(): void;
  
  /** Get pool metrics */
  getPoolMetrics(): ConnectionPoolMetrics;
  
  /** Get pool statistics */
  getPoolStatistics(hours: number): ConnectionPoolMetrics[];
}

/**
 * System health monitor interface
 */
export interface ISystemHealthMonitor {
  /** Get system health status */
  getHealthStatus(): Promise<SystemHealthStatus>;
  
  /** Get health check results */
  getHealthChecks(): Promise<HealthCheckResult[]>;
  
  /** Register health check */
  registerHealthCheck(check: HealthCheck): void;
  
  /** Remove health check */
  removeHealthCheck(name: string): boolean;
  
  /** Run all health checks */
  runHealthChecks(): Promise<HealthCheckResult[]>;
}

/**
 * System health status
 */
export interface SystemHealthStatus {
  /** Overall health */
  healthy: boolean;
  
  /** Health score (0-100) */
  score: number;
  
  /** Status message */
  message: string;
  
  /** Component statuses */
  components: Record<string, {
    healthy: boolean;
    message?: string;
    lastCheck: Date;
  }>;
  
  /** System metrics */
  metrics: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

/**
 * Health check interface
 */
export interface HealthCheck {
  /** Check name */
  name: string;
  
  /** Check description */
  description: string;
  
  /** Check function */
  check: () => Promise<HealthCheckResult>;
  
  /** Check interval (ms) */
  interval: number;
  
  /** Check timeout (ms) */
  timeout: number;
  
  /** Check enabled */
  enabled: boolean;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Check name */
  name: string;
  
  /** Health status */
  healthy: boolean;
  
  /** Status message */
  message?: string;
  
  /** Check duration (ms) */
  duration: number;
  
  /** Check timestamp */
  timestamp: Date;
  
  /** Additional details */
  details?: Record<string, any>;
}

/**
 * Monitoring system interface
 */
export interface IMonitoringSystem extends EventEmitter {
  /** Initialize monitoring system */
  initialize(config: MonitoringConfig): Promise<void>;
  
  /** Shutdown monitoring system */
  shutdown(): Promise<void>;
  
  /** Get metrics collector */
  getMetricsCollector(): IMetricsCollector;
  
  /** Get alert manager */
  getAlertManager(): IAlertManager;
  
  /** Get dashboard manager */
  getDashboardManager(): IDashboardManager;
  
  /** Get performance monitor */
  getPerformanceMonitor(): IPerformanceMonitor;
  
  /** Get load tester */
  getLoadTester(): ILoadTester;
  
  /** Get cache monitor */
  getCacheMonitor(): ICacheMonitor;
  
  /** Get connection pool monitor */
  getConnectionPoolMonitor(): IConnectionPoolMonitor;
  
  /** Get system health monitor */
  getSystemHealthMonitor(): ISystemHealthMonitor;
  
  /** Export metrics */
  exportMetrics(format: 'prometheus' | 'json'): Promise<string>;
  
  /** Get monitoring status */
  getStatus(): Promise<{
    running: boolean;
    uptime: number;
    components: Record<string, boolean>;
  }>;
}