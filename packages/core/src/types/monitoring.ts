/**
 * @fileoverview Monitoring and metrics type definitions
 */

// Metrics Types
export interface Metric {
  name: string;
  value: number;
  type: MetricType;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  source: string;
}

export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
  TIMER = 'TIMER',
}

export interface MetricSeries {
  name: string;
  dataPoints: MetricDataPoint[];
  metadata: unknown;
    unit: string;
    type: MetricType;
    description?: string;
  };
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
}

// Performance Monitoring
export interface PerformanceMetrics {
  system: SystemMetrics;
  application: ApplicationMetrics;
  agents: AgentMetrics[];
  workflows: WorkflowMetrics[];
  timestamp: Date;
}

export interface SystemMetrics {
  cpu: unknown;
    usage: number; // percentage
    cores: number;
    loadAverage: number[];
  };
  memory: unknown;
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage
    heap: unknown;
      used: number;
      total: number;
    };
  };
  disk: unknown;
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage
    iops: number;
  };
  network: unknown;
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connections: number;
  };
}

export interface ApplicationMetrics {
  uptime: number; // seconds
  requestCount: number;
  errorCount: number;
  responseTime: unknown;
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  activeConnections: number;
  databaseConnections: unknown;
    active: number;
    idle: number;
    total: number;
  };
}

export interface AgentMetrics {
  agentId: string;
  status: string;
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskTime: number;
  resourceUtilization: unknown;
    cpu: number;
    memory: number;
  };
  lastActivity: Date;
}

export interface WorkflowMetrics {
  workflowId: string;
  executionsCount: number;
  successRate: number;
  averageExecutionTime: number;
  currentlyRunning: number;
  lastExecution: Date;
}

// Alerting
export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  condition: AlertCondition;
  actions: AlertAction[];
  createdAt: Date;
  triggeredAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  SUPPRESSED = 'SUPPRESSED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export interface AlertCondition {
  metric: string;
  operator: 'greater' | 'less' | 'equals' | 'not_equals';
  threshold: number;
  duration: number; // seconds
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'log';
  config: Record<string, any>;
  enabled: boolean;
}

// Logging
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  traceId?: string;
  spanId?: string;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

// Tracing
export interface Trace {
  traceId: string;
  spans: Span[];
  duration: number;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'error';
  metadata?: Record<string, any>;
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  tags: Record<string, any>;
  logs: SpanLog[];
  status: 'success' | 'error';
}

export interface SpanLog {
  timestamp: Date;
  fields: Record<string, any>;
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: ServiceHealth[];
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: Date;
  details?: Record<string, any>;
}