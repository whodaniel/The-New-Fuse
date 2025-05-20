import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { Logger } from '../common/logger.service.js';

export interface WorkflowMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgTaskDuration: number;
  resourceUtilization: Map<string, number>;
}

@Injectable()
export class WorkflowMonitoringService {
  private readonly metricsPrefix = 'workflow:metrics:';
  private readonly statusPrefix = 'workflow:status:';

  constructor(
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    private readonly logger: Logger
  ) {}

  async trackWorkflowExecution(workflowId: string, event: any): Promise<void> {
    try {
      const key = `${this.statusPrefix}${workflowId}`;
      await this.redis.hset(key, {
        lastEvent: JSON.stringify(event),
        timestamp: Date.now().toString(),
        status: event.type
      });

      await this.updateMetrics(workflowId, event);
      await this.notifySubscribers(workflowId, event);
    } catch (error) {
      this.logger.error('Error tracking workflow execution:', error);
    }
  }

  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    const key = `${this.metricsPrefix}${workflowId}`;
    const rawMetrics = await this.redis.hgetall(key);
    
    return {
      totalTasks: parseInt(rawMetrics.totalTasks || '0'),
      completedTasks: parseInt(rawMetrics.completedTasks || '0'),
      failedTasks: parseInt(rawMetrics.failedTasks || '0'),
      avgTaskDuration: parseFloat(rawMetrics.avgTaskDuration || '0'),
      resourceUtilization: new Map(JSON.parse(rawMetrics.resourceUtilization || '[]'))
    };
  }

  async updateMetrics(workflowId: string, event: any): Promise<void> {
    const key = `${this.metricsPrefix}${workflowId}`;
    const currentMetrics = await this.getWorkflowMetrics(workflowId);

    switch (event.type) {
      case 'TASK_COMPLETED':
        currentMetrics.completedTasks++;
        break;
      case 'TASK_FAILED':
        currentMetrics.failedTasks++;
        break;
      case 'RESOURCE_USAGE':
        currentMetrics.resourceUtilization.set(
          event.resource,
          event.utilization
        );
        break;
    }

    await this.redis.hmset(key, {
      ...currentMetrics,
      resourceUtilization: JSON.stringify(Array.from(currentMetrics.resourceUtilization.entries()))
    });

    await this.metrics.recordMetrics(workflowId, currentMetrics);
  }

  private async notifySubscribers(workflowId: string, event: any): Promise<void> {
    const channel = `workflow:events:${workflowId}`;
    await this.redis.publish(channel, JSON.stringify(event));
  }

  async subscribeToWorkflow(workflowId: string, callback: (event: any) => void): Promise<void> {
    const channel = `workflow:events:${workflowId}`;
    await this.redis.subscribe(channel, callback);
  }

  async unsubscribeFromWorkflow(workflowId: string): Promise<void> {
    const channel = `workflow:events:${workflowId}`;
    await this.redis.unsubscribe(channel);
  }
}