import { MetricsCollectorOptions } from '@the-new-fuse/types';

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

export enum MetricUnit {
  COUNT = 'count',
  BYTES = 'bytes',
  MILLISECONDS = 'ms',
  PERCENT = 'percent',
  MEGABYTES = 'mb',
  SECONDS = 'seconds',
  OPS = 'ops'
}

export interface MetricLabel {
  name: string;
  value: string;
}

export interface AggregatedMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  last: number;
  timestamp: number;
}

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  unit: MetricUnit;
  timestamp: Date;
  labels?: MetricLabel[];
}

export interface Alert {
  id: string;
  name: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  labels?: MetricLabel[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
}

export interface MonitoringOptions {
  metricsPrefix: string;
  retentionPeriod: number;
  aggregationInterval: number;
  maxDataPoints: number;
  alertThresholds?: Record<string, number>;
  healthCheckInterval?: number;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAvg: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  io: {
    read: number;
    write: number;
  };
  network: {
    rx: number;
    tx: number;
    connections: number;
  };
  time: {
    uptime: number;
    timestamp: number;
  };
  process: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    workers: number;
    eventLoopLag: number;
  };
}

export interface DatabaseMetrics {
  queries: number;
  errors: number;
  avgLatencyMs: number;
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
  timings: {
    p50: number;
    p90: number;
    p99: number;
  };
}

export interface MetricsSnapshot {
  system: SystemMetrics;
  database: Record<string, DatabaseMetrics>;
  timestamp: number;
  version: string;
  environment: string;
  region?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
  layout: DashboardLayout;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    owner: string;
    tags?: string[];
  };
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'gauge' | 'table' | 'text';
  metrics: string[];
  options: {
    timeRange?: {
      start: Date;
      end: Date;
    };
    refreshInterval?: number;
    visualization?: {
      type: string;
      options: Record<string, unknown>;
    };
  };
}

export interface DashboardLayout {
  rows: number;
  cols: number;
  panels: {
    panelId: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
}

export interface HealthCheck {
  id: string;
  name: string;
  type: 'http' | 'tcp' | 'custom';
  target: string;
  interval: number;
  timeout: number;
  status: 'up' | 'down' | 'degraded';
  lastCheck: Date;
  metadata: {
    dependencies?: string[];
    importance: 'critical' | 'high' | 'medium' | 'low';
    owner?: string;
    documentation?: string;
  };
}

export interface PerformanceProfile {
  id: string;
  timestamp: Date;
  duration: number;
  type: 'cpu' | 'memory' | 'io' | 'network';
  data: {
    samples: ProfileSample[];
    summary: ProfileSummary;
  };
  metadata: {
    environment: string;
    version: string;
    trigger: string;
    tags?: string[];
  };
}

export interface ProfileSample {
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
}

export interface ProfileSummary {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface TraceSpan {
  id: string;
  parentId?: string;
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'success' | 'error';
  attributes: Record<string, unknown>;
  events: {
    name: string;
    timestamp: Date;
    attributes?: Record<string, unknown>;
  }[];
}

export interface Trace {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'success' | 'error';
  spans: TraceSpan[];
  metadata: {
    service: string;
    environment: string;
    version: string;
    userId?: string;
    sessionId?: string;
    tags?: string[];
  };
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    enabled: boolean;
    interval: number;
    retention: number;
  };
  alerts: {
    enabled: boolean;
    channels: string[];
  };
  tracing: {
    enabled: boolean;
    sampleRate: number;
  };
  profiling: {
    enabled: boolean;
    interval: number;
  };
  healthChecks: {
    enabled: boolean;
    interval: number;
  };
}

export interface MetricValue {
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface AlertConfig {
  name: string;
  metric: keyof SystemMetrics;
  thresholds: {
    warning?: number;
    critical?: number;
  };
  duration?: number; // Duration in ms that threshold must be exceeded
  cooldown?: number; // Minimum time between alerts
}

export interface MonitoringOptions extends MetricsCollectorOptions {
  alerts?: AlertConfig[];
  healthCheck?: {
    interval: number;
    timeout: number;
  };
  retention?: {
    metrics: number; // Time in seconds to keep metrics
    alerts: number;  // Time in seconds to keep alerts
  };
}

export interface ProcessStats {
  pid: number;
  ppid?: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  uptime: number;
  threadCount?: number;
  handles?: number;
}

export interface MetricsEvent {
  type: string;
  source: string;
  value: number;
  unit: MetricUnit;
  labels: MetricLabel[];
  timestamp: Date;
}

export interface MetricsAggregation {
  avg: number;
  min: number;
  max: number;
  count: number;
  rate: number;
  p50?: number;
  p90?: number;
  p99?: number;
}
