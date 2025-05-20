export declare enum MetricType {
    COUNTER = "counter",
    GAUGE = "gauge",
    HISTOGRAM = "histogram",
    SUMMARY = "summary"
}
export declare enum MetricUnit {
    MILLISECONDS = "ms",
    SECONDS = "s",
    MINUTES = "m",
    HOURS = "h",
    DAYS = "d",
    BYTES = "b",
    KILOBYTES = "kb",
    MEGABYTES = "mb",
    GIGABYTES = "gb",
    COUNT = "count",
    PERCENTAGE = "%"
}
export interface MetricLabel {
    name: string;
    value: string;
}
export interface Metric {
    name: string;
    type: MetricType;
    value: number;
    unit: MetricUnit;
    timestamp: Date;
    labels: MetricLabel[];
}
export interface Alert {
    id: string;
    name: string;
    description: string;
    condition: string;
    severity: info' | 'warning' | 'error' | 'critical';
    status: active' | 'resolved';
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    metadata: {
        source: string;
        metric?: string;
        threshold?: number;
        duration?: number;
        tags?: string[];
    };
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
    type: graph' | 'gauge' | 'table' | 'text';
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
    type: http' | 'tcp' | 'custom';
    target: string;
    interval: number;
    timeout: number;
    status: up' | 'down' | 'degraded';
    lastCheck: Date;
    metadata: {
        dependencies?: string[];
        importance: critical' | 'high' | 'medium' | 'low';
        owner?: string;
        documentation?: string;
    };
}
export interface PerformanceProfile {
    id: string;
    timestamp: Date;
    duration: number;
    type: cpu' | 'memory' | 'io' | 'network';
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
    status: success' | 'error';
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
    status: success' | 'error';
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
