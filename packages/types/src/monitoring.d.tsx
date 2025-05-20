export interface MonitoringConfig {
    enabled: boolean;
    interval: number;
    thresholds: {
        cpu: number;
        memory: number;
        latency: number;
        errorRate: number;
    };
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    details: {
        cpu: number;
        memory: number;
        latency: number;
        errorRate: number;
    };
    message?: string;
}
export interface AlertConfig {
    name: string;
    condition: string;
    threshold: number;
    cooldown: number;
    channels: string[];
}
export interface ServiceStatus {
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    updatedAt: Date;
    message?: string;
}
export interface Alert {
    id: string;
    title: string;
    severity: 'info' | 'warning' | 'critical';
    timestamp: Date;
    source: string;
    status: 'active' | 'resolved';
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=monitoring.d.ts.map