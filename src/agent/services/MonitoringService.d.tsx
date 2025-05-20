import { PrometheusService } from './PrometheusService.js';
import { RedisService } from './RedisService.js';
interface AgentMetrics {
  messagesSent: number;
  messagesReceived: number;
  processingTime: number;
  errorCount: number;
  successCount: number;
  lastActive: Date;
}
interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  activeAgents: number;
  totalMessages: number;
  errorRate: number;
}
export declare class MonitoringService {
  private prometheus;
  private redis;
  private eventEmitter;
  private readonly logger;
  private readonly agentMetrics;
  private systemMetrics;
  private metricsInterval;
  constructor(
    prometheus: PrometheusService,
    redis: RedisService,
    eventEmitter: EventEmitter2,
  );
  private initializeMetrics;
  private startMetricsCollection;
  private collectSystemMetrics;
  trackAgentMetrics(agentId: string, metrics: AgentMetrics): Promise<void>;
  getAgentMetrics(agentId: string): Promise<AgentMetrics | null>;
  getAllMetrics(): Promise<{
    system: SystemMetrics;
    agents: Map<string, AgentMetrics>;
  }>;
  checkAgentHealth(agentId: string): Promise<{
    healthy: boolean;
    lastActive: Date | null;
    errorRate: number;
  }>;
  onModuleDestroy(): void;
}
export {};
