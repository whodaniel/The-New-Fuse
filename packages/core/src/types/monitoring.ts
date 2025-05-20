export interface SystemMetrics {
    timestamp: Date;
    cpu: {
        usage: number;
        temperature?: number;
        cores: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        cached?: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        readSpeed?: number;
        writeSpeed?: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
        errors?: number;
    };
    process: {
        uptime: number;
        threads: number;
        handles?: number;
    };
}

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    checks: {
        [key: string]: {
            status: 'pass' | 'warn' | 'fail';
            message?: string;
            timestamp: Date;
            metadata?: Record<string, unknown>;
        };
    };
    metadata?: Record<string, unknown>;
}

export interface Alert {
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    source: string;
    metadata?: Record<string, unknown>;
    acknowledged?: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

export interface AlertRule {
    id: string;
    name: string;
    description?: string;
    condition: {
        metric: string;
        operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
        value: number;
        duration?: number;
    };
    severity: 'info' | 'warning' | 'error' | 'critical';
    actions?: AlertAction[];
    enabled: boolean;
    metadata?: Record<string, unknown>;
}

export interface AlertAction {
    type: string;
    config: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface MonitoringConfig {
    metrics: {
        interval: number;
        retention: number;
        detailed: boolean;
    };
    health: {
        interval: number;
        timeout: number;
    };
    alerts: {
        enabled: boolean;
        checkInterval: number;
    };
    storage: {
        type: 'memory' | 'file' | 'database';
        config?: Record<string, unknown>;
    };
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface MonitoringService {
  recordMetric(metric: MetricData): Promise<void>;
  getMetrics(query: MetricQuery): Promise<MetricData[]>;
}

export interface MetricQuery {
  name?: string;
  startTime?: Date;
  endTime?: Date;
  labels?: Record<string, string>;
}
