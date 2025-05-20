import { Injectable } from '@nestjs/common';
import { PrometheusService } from './PrometheusService.js';
import { RedisService } from './RedisService.js';

@Injectable()
export class MonitoringService {
  constructor(
    private prometheus: PrometheusService,
    private redis: RedisService
  ) {}

  async trackAgentMetrics(): Promise<void> {agentId: string, metrics: AgentMetrics): Promise<any> {
    await(this as any): metrics:$ {agentId}`, metrics);
  }
}