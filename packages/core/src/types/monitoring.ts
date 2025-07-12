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
}

export interface HealthCheckResult {
    status: 'pass' | 'warn' | 'fail';
    component: string;
    description?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    observedValue?: number;
    observedUnit?: string;
    targetValue?: number;
    targetUnit?: string;
    operator?: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
    type?: 'memory' | 'file' | 'database' | 'network' | 'cpu' | 'disk';
    details?: Record<string, unknown>;
}