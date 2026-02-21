export enum MetricType {
    RESPONSE_TIME = 'response_time',
    CPU_USAGE = 'cpu_usage',
    MEMORY_USAGE = 'memory_usage',
    SUCCESS_RATE = 'success_rate',
    ERROR_RATE = 'error_rate',
    THROUGHPUT = 'throughput'
}

export interface ValidationResult {
    errors: string[];
    warnings: string[];
    isValid: boolean;
}

export interface AgentMetrics {
    responseTime: number;
    successRate: number;
    cpuUsage: number;
    memoryUsage: number;
    throughput: number;
    errorRate: number;
    timestamp: number;
}