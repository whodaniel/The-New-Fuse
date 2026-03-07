export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface ServiceMetrics {
  requestCount: MetricValue;
  responseTime: MetricValue;
  errorRate: MetricValue;
  cpuUsage: MetricValue;
  memoryUsage: MetricValue;
  activeConnections: MetricValue;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, {
    status: 'up' | 'down';
    latency?: number;
    message?: string;
  }>;
  timestamp: Date;
}
