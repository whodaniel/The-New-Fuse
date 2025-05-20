import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';

export interface PerformanceMetrics {
  latency: number;
  throughput: number;
  errorRate: number;
  resourceUtilization: Record<string, number>;
}

@Injectable()
export class AnalyticsIntegrationService {
  private readonly metricPrefix = 'analytics:';

  constructor(
    private readonly mcpBroker: MCPBrokerService,
    private readonly metrics: MetricsService,
    private readonly workflowMonitor: WorkflowMonitoringService,
    private readonly logger: Logger
  ) {
    this.initializeAnalytics();
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      await this.mcpBroker.executeDirective('analytics', 'initialize', {
        metricTypes: [
          'workflow_performance',
          'agent_performance',
          'tool_usage',
          'resource_utilization'
        ]
      });
    } catch (error) {
      this.logger.error('Failed to initialize analytics:', error);
    }
  }

  async trackWorkflowPerformance(workflowId: string): Promise<PerformanceMetrics> {
    const metrics = await this.workflowMonitor.getWorkflowMetrics(workflowId);
    const performance: PerformanceMetrics = {
      latency: await this.calculateAverageLatency(workflowId), // Ensure this handles no events
      throughput: await this.calculateThroughput(workflowId), // Ensure this handles no duration/tasks
      errorRate: (metrics.completedTasks + metrics.failedTasks) > 0 ?
        metrics.failedTasks / (metrics.completedTasks + metrics.failedTasks) : 0,
      resourceUtilization: Object.fromEntries(metrics.resourceUtilization)
    };

    await this.recordPerformanceMetrics(workflowId, performance);
    return performance;
  }

  async trackAgentPerformance(agentId: string): Promise<PerformanceMetrics> {
    const agentMetrics = await this.metrics.getAgentMetrics(agentId);
    const performance: PerformanceMetrics = {
      latency: agentMetrics.averageLatency,
      throughput: agentMetrics.tasksThroughput,
      errorRate: agentMetrics.errorRate,
      resourceUtilization: agentMetrics.resourceUsage
    };

    await this.recordPerformanceMetrics(agentId, performance, 'agent');
    return performance;
  }

  async trackToolUsage(toolName: string): Promise<void> {
    await this.mcpBroker.executeDirective('analytics', 'trackToolUsage', {
      tool: toolName,
      timestamp: Date.now(),
      metadata: {
        context: 'workflow_execution'
      }
    });
  }

  private async calculateAverageLatency(workflowId: string): Promise<number> {
    const events = await this.workflowMonitor.getWorkflowEvents(workflowId);
    if (events.length === 0) return 0;

    const latencies = events
      .filter(e => e.type === 'TASK_COMPLETED')
      .map(e => e.duration);

    return latencies.length > 0 ?
      latencies.reduce((a, b) => a + b, 0) / latencies.length :
      0;
  }

  private async calculateThroughput(workflowId: string): Promise<number> {
    const metrics = await this.workflowMonitor.getWorkflowMetrics(workflowId);
    const totalTasks = metrics.completedTasks + metrics.failedTasks;
    const duration = await this.getWorkflowDuration(workflowId);
    
    return duration > 0 ? totalTasks / duration : 0;
  }

  private async getWorkflowDuration(workflowId: string): Promise<number> {
    const events = await this.workflowMonitor.getWorkflowEvents(workflowId);
    if (events.length < 2) return 0;

    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;
    return (endTime - startTime) / 1000; // Convert to seconds
  }

  private async recordPerformanceMetrics(
    id: string,
    metrics: PerformanceMetrics,
    type: 'workflow' | 'agent' = 'workflow'
  ): Promise<void> {
    const key = `${this.metricPrefix}${type}:${id}`;
    await this.metrics.recordMetrics(key, metrics);

    await this.mcpBroker.executeDirective('analytics', 'recordPerformance', {
      entityId: id,
      entityType: type,
      metrics,
      timestamp: Date.now()
    });
  }
}