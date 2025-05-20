export interface MetricsData {
    avg_queue_length: number;
    avg_message_latency_ms: number;
    avg_state_transfer_time_ms: number;
    avg_memory_usage_mb: number;
    avg_cpu_usage_percent: number;
    total_errors: number;
    uptime_seconds: number;
    alerts: {
        [key: string]: {
            level: 'warning' | 'error';
            message: string;
            value: number;
        };
    };
}
export interface PerformanceData {
    timestamp: number;
    cpuUsage: number;
    memoryUsage: number;
    activeAgents: number;
}
export interface SystemData {
    name: string;
    agents: number;
    tasks: number;
    interactions: number;
}
