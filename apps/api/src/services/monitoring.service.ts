import { Injectable } from '@nestjs/common';
import { SystemMonitor, MetricsCollector, PerformanceMonitor } from '@the-new-fuse/core';
import { AgentService } from './agent.service.js';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly systemMonitor: SystemMonitor,
    private readonly metricsCollector: MetricsCollector,
    private readonly performanceMonitor: PerformanceMonitor,
    private readonly agentService: AgentService,
  ) {}

  async getHealth(): Promise<any> {
    const [system, database] = await Promise.all([
      this.systemMonitor.getHealth(),
      this.checkDatabaseHealth(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date(),
      services: {
        system,
        database,
      },
    };
  }

  async getMetrics(): Promise<any> {
    return {
      system: await this.systemMonitor.getLatestStats(),
      performance: await this.performanceMonitor.getMetrics(),
      custom: await this.metricsCollector.getCustomMetrics(),
    };
  }

  async getAgentStatus(): Promise<any> {
    const agents = await this.agentService.findAll();
    const statuses = await Promise.all(
      agents.map(async (agent) => ({
        id: agent.id,
        status: await this.systemMonitor.getAgentStatus(agent.id),
      })),
    );

    return {
      timestamp: new Date(),
      agents: statuses,
    };
  }

  async getPerformance(): Promise<any> {
    return {
      ...(await this.performanceMonitor.getDetailedMetrics()),
      timestamp: new Date(),
    };
  }

  async getErrors(): Promise<any> {
    return {
      recent: await this.systemMonitor.getRecentErrors(),
      summary: await this.metricsCollector.getErrorMetrics(),
    };
  }

  async getResources(): Promise<any> {
    return {
      ...(await this.systemMonitor.getResourceUsage()),
    };
  }

  async getMemoryItems(): Promise<{ items: any[]; stats: { totalItems: number; hitRate: number } }> {
    // TODO: connect to real memory store
    return { items: [], stats: { totalItems: 0, hitRate: 0 } };
  }

  async getCustomMetrics(): Promise<{ stepMetrics: any[]; memoryMetrics: { totalItems: number; hitRate: number } }> {
    const custom = await this.metricsCollector.getCustomMetrics();
    // Expect custom has stepMetrics and memoryMetrics
    return {
      stepMetrics: custom.stepMetrics || [],
      memoryMetrics: custom.memoryMetrics || { totalItems: 0, hitRate: 0 },
    };
  }

  private async checkDatabaseHealth(): Promise<any> {
    try {
      // Add database health check logic here
      return {
        status: 'ok',
        latency: 0,
      };
    } catch (error: unknown) { // Explicitly type error as unknown
      return {
        status: 'error',
        // Check if error is an instance of Error before accessing message
        error: error instanceof Error ? error.message : 'An unknown database error occurred',
      };
    }
  }
}
