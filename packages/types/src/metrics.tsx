export type MetricRecord = {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  latencyMs?: number[];
};

export type MetricEvent = {
  metric: MetricRecord;
  source: string;
  environment: string;
};

export type SystemMetrics = {
  latencyP50?: number;
  latencyP90?: number;
  latencyP99?: number;
  errorRate?: number;
  throughput?: number;
  timestamp: Date;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkIn?: number;
  networkOut?: number;
  requestCount?: number;
  concurrentUsers?: number;
};

export type MetricsThreshold = {
  metric: keyof SystemMetrics;
  min?: number;
  max?: number;
  warning?: number;
  critical?: number;
};

export type MetricsAlert = {
  id: string;
  timestamp: number;
  metric: keyof SystemMetrics;
  value: number;
  threshold: number;
  level: 'warning' | 'critical';
  message: string;
};

export type MetricsQuery = {
  startTime: Date;
  endTime: Date;
  metrics: (keyof SystemMetrics)[];
  interval?: string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
};

export type MetricsResult = {
  metric: keyof SystemMetrics;
  values: number[];
  timestamps: Date[];
};

export type SystemPerformanceMetrics = SystemMetrics & {
  requestsPerSecond?: number;
  averageResponseTime?: number;
  errorCount?: number;
  successRate?: number;
};

export interface MetricsConfig {
  enabled: boolean;
  interval: number;
  prefix: string;
  retention?: {
    duration: number;
    resolution: number;
  };
  alerting?: {
    enabled: boolean;
    checkInterval: number;
  };
}

export interface MetricsService {
  collectMetrics(): Promise<SystemPerformanceMetrics>;
  queryMetrics(query: MetricsQuery): Promise<MetricsResult[]>;
  record(metric: keyof SystemMetrics, value: number): Promise<void>;
  query(query: MetricsQuery): Promise<MetricsResult[]>;
  setThreshold(threshold: MetricsThreshold): void;
  getThresholds(): MetricsThreshold[];
  getAlerts(): MetricsAlert[];
  subscribe(callback: (alert: MetricsAlert) => void): () => void;
}

export interface AlertConfig {
  threshold: number;
  level: 'warning' | 'critical';
};

export interface MetricConfig {
  name: string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
};

export interface DatabaseMetrics {
  shardName: string;
  connections: number;
  queries: number;
  errors: number;
  latencyMs: number[];
  avgLatencyMs: number;
  queryTimeMs: number[];
  avgQueryTimeMs: number;
}

export interface RedisMetrics {
  connectedClients: number;
  usedMemoryBytes: number;
  totalCommandsProcessed: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  pubsubChannels: number;
  pubsubPatterns: number;
  totalConnectionsReceived: number;
  rejectedConnections: number;
  expiredKeys: number;
  evictedKeys: number;
  lastSaveTime: number;
}

export interface ShardMetrics {
  [shardName: string]: DatabaseMetrics;
}

export interface MetricsCollectorOptions {
  metricsPrefix?: string;
  retentionPeriod?: number;
  aggregationInterval?: number;
  maxDataPoints?: number;
}

export interface MetricsHistoryEntry {
  timestamp: number;
  metrics: DatabaseMetrics | RedisMetrics;
}

export interface MetricsSnapshot {
  database: ShardMetrics;
  redis: RedisMetrics | null;
  timestamp: number;
}
