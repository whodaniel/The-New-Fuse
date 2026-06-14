/**
 * @fileoverview Monitoring and metrics type definitions
 */
export interface Metric {
    name: string;
    value: number;
    type: MetricType;
    unit: string;
    timestamp: Date;
    tags: Record<string, string>;
    source: string;
}
export declare enum MetricType {
    COUNTER = "COUNTER",
    GAUGE = "GAUGE",
    HISTOGRAM = "HISTOGRAM",
    TIMER = "TIMER"
}
export interface MetricSeries {
    name: string;
    dataPoints: MetricDataPoint[];
    metadata: {
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
export interface PerformanceMetrics {
    system: SystemMetrics;
    application: ApplicationMetrics;
    agents: AgentMetrics[];
    workflows: WorkflowMetrics[];
    timestamp: Date;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        cores: number;
        loadAverage: number[];
    };
    memory: {
        used: number;
        total: number;
        usage: number;
        heap: {
            used: number;
            total: number;
        };
    };
    disk: {
        used: number;
        total: number;
        usage: number;
        iops: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
        connections: number;
    };
}
export interface ApplicationMetrics {
    uptime: number;
    requestCount: number;
    errorCount: number;
    responseTime: {
        average: number;
        p50: number;
        p95: number;
        p99: number;
    };
    activeConnections: number;
    databaseConnections: {
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
    resourceUtilization: {
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
export declare enum AlertSeverity {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export declare enum AlertStatus {
    ACTIVE = "ACTIVE",
    RESOLVED = "RESOLVED",
    SUPPRESSED = "SUPPRESSED",
    ACKNOWLEDGED = "ACKNOWLEDGED"
}
export interface AlertCondition {
    metric: string;
    operator: 'greater' | 'less' | 'equals' | 'not_equals';
    threshold: number;
    duration: number;
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}
export interface AlertAction {
    type: 'email' | 'webhook' | 'slack' | 'log';
    config: Record<string, any>;
    enabled: boolean;
}
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
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL"
}
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
//# sourceMappingURL=monitoring.d.ts.map