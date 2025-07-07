export interface MonitoringMetrics {
    timestamp: Date;
    queueLength: number;
    messageLatencyMs: number;
    stateTransferTimeMs: number;
    connectionCount: number;
    memoryUsageMb: number;
    cpuUsagePercent: number;
    errorCount: number;
}
