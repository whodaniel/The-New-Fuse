export interface MemoryUsageMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}
export interface QueueMetrics {
  currentSize: number;
  peakSize: number;
  avgProcessingTime: number;
}
export interface AgentMetrics {
  agentId: string;
  tasksProcessed: number;
  successfulTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  lastActive: number;
}
export interface SystemMetrics {
  startTime: number;
  lastUpdate: number;
  errorCount: number;
  successCount: number;
  totalProcessed: number;
  activeAgents: number;
  queueMetrics: QueueMetrics;
  processingTimes: number[];
  memoryUsage: MemoryUsageMetrics;
  agentMetrics: Map<string, AgentMetrics>;
}
