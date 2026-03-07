/**
 * Unified monitoring interfaces for all TNF systems
 */

import { EventEmitter } from 'events';

/**
 * Generic metric data point
 */
export interface MetricDataPoint<T = number> {
  timestamp: Date;
  value: T;
  labels?: Record<string, string>;
}

/**
 * Time series data structure
 */
export interface TimeSeries<T = number> {
  name: string;
  dataPoints: MetricDataPoint<T>[];
  metadata?: {
    labels?: Record<string, string>;
    unit?: string;
    description?: string;
  };
}

/**
 * Generic metrics collector interface
 */
export interface IMetricsCollector<TMetrics = any> extends EventEmitter {
  start(): Promise<void>;
  stop(): Promise<void>;
  recordMetric(name: string, value: number, labels?: Record<string, string>): void;
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;
  getCurrentMetrics(): TMetrics;
  getMetricsHistory(hours: number): TimeSeries[];
  getMetric(name: string): TimeSeries | null;
}

/**
 * Generic monitoring system interface
 */
export interface IMonitoringSystem<TMetrics = any, TConfig = any> extends EventEmitter {
  initialize(config: TConfig): Promise<void>;
  shutdown(): Promise<void>;
  getMetricsCollector(): IMetricsCollector<TMetrics>;
  exportMetrics(format: 'prometheus' | 'json'): Promise<string>;
  getStatus(): Promise<{
    running: boolean;
    uptime: number;
    components: Record<string, boolean>;
  }>;
}

/**
 * Alert configuration
 */
export interface AlertRule {
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  duration: number; // ms
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

/**
 * Alert manager interface
 */
export interface IAlertManager extends EventEmitter {
  addRule(rule: AlertRule): void;
  removeRule(name: string): void;
  checkAlerts(metrics: any): void;
  getActiveAlerts(): Alert[];
}

/**
 * Alert instance
 */
export interface Alert {
  id: string;
  rule: AlertRule;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved';
  value: number;
}

/**
 * Performance monitor interface
 */
export interface IPerformanceMonitor extends EventEmitter {
  start(): Promise<void>;
  stop(): Promise<void>;
  recordOperation(name: string, duration: number, success: boolean): void;
  getPerformanceMetrics(): PerformanceMetrics;
}

/**
 * Generic performance metrics
 */
export interface PerformanceMetrics {
  operations: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    p95Duration: number;
    p99Duration: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    healthScore: number;
  };
}

/**
 * Dashboard manager interface
 */
export interface IDashboardManager {
  generateDashboard(metrics: any): Promise<string>;
  updateDashboard(metrics: any): Promise<void>;
  getDashboardUrl(): string;
}

/**
 * System health monitor interface
 */
export interface ISystemHealthMonitor extends EventEmitter {
  checkHealth(): Promise<HealthStatus>;
  getHealthHistory(): HealthStatus[];
}

/**
 * Health status
 */
export interface HealthStatus {
  timestamp: Date;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    responseTime?: number;
  }>;
  score: number; // 0-100
}