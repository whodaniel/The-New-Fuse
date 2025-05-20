import { SystemPerformanceMetrics } from './metrics.js';

export type ResourceManager = {
  getCPUUsage(): Promise<number>;
  getMemoryUsage(): Promise<number>;
  getAverageLatency(): Promise<number>;
  getThroughput(): Promise<number>;
  getRequestCount(): Promise<number>;
  getConcurrentUsers(): Promise<number>;
  getCurrentUsage(): Promise<SystemPerformanceMetrics>;
};

export type ResourceMetrics = {
  cpu: number;
  memory: number;
  latency: number;
  throughput: number;
  requestCount: number;
  concurrentUsers: number;
  timestamp: Date;
};
