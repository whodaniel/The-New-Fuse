export interface SystemPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  heapUsage: number;
  threadCount: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  averageResponseTime: number;
  uptime: number;
  loadAverage: number[];
  timestamp: Date;
}