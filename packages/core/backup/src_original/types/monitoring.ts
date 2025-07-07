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
    status: 'healthy' | degraded' | unhealthy'
            status:pass' | warn' | fail'
    severity:info' | warning' | error' | critical'
        operator:gt' | lt' | eq' | ne' | gte' | lte'
    severity:info' | warning' | error' | critical'
        type:memory' | file' | database'