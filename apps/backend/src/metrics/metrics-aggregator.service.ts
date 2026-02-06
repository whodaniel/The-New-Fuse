import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from '../modules/agent/agent.service';
import { SystemMetricsService } from '../modules/system-metrics/system-metrics.service';

@Injectable()
export class MetricsAggregatorService {
  private readonly logger = new Logger(MetricsAggregatorService.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly systemMetricsService: SystemMetricsService
  ) {}

  async getDashboardMetrics() {
    try {
      const [agentStats, systemMetrics] = await Promise.all([
        this.agentService.getSystemAgentStats(),
        this.systemMetricsService.getMetrics(),
      ]);

      return {
        activeAgents: {
          value: agentStats.running || 0,
          change: 0,
        },
        systemLoad: {
          value: systemMetrics.cpu?.usagePercent || 0,
          change: 0,
        },
        tasksCompleted: {
          value: 0,
          change: 0,
        },
        avgResponse: {
          // Convert ms to seconds with 2 decimals
          value: systemMetrics.api?.avgResponseTime
            ? parseFloat((systemMetrics.api.avgResponseTime / 1000).toFixed(2))
            : 0,
          change: 0,
        },
        workspaceCount: {
          value: 0,
          change: 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to aggregate dashboard metrics: ${error.message}`, error.stack);
      // We rethrow so the controller can handle it or let global filter handle it
      // But to prevent "Backend unavailable" which is likely a 404 or 500, we could return a fallback here?
      // The instruction says "Mock data fallbacks in catch blocks are to be removed in favor of letting the error bubble up."
      // So I will let it bubble up.
      throw error;
    }
  }
}
