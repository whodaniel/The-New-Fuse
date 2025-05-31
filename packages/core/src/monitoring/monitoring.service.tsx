interface AgentMetrics {
  cpuUsage: number;
  memoryUsage: number;
  averageLatency: number;
}

interface WorkflowProgress {
  tasks: WorkflowTask[];
  resourceLimits: Record<string, number>;
}

interface WorkflowTask {
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
}

interface WorkflowMetrics {
  completionRate: number;
  errorRate: number;
  averageDuration: number;
  resourceUtilization: number;
}

interface TraeMetrics {
  responseTime: number;
  memoryUsage: number;
  activeTasks: number;
  successRate: number;
}

interface LLMMetrics {
  latency: number;
  activeRequests: number;
  errorCount: number;
  errorRate: number;
}

export class MonitoringService {
  constructor(
    private readonly metrics: MetricsRegistry,
    private readonly alerting: AlertingService,
    private readonly storage: TimeSeriesStorage,
    private readonly logger: Logger
  ) {}

  async trackAgentMetrics(agentId: string, metrics: AgentMetrics): Promise<void> {
    const timestamp = Date.now();
    
    await Promise.all([
      this.storage.record('agent_cpu', timestamp, {
        agentId,
        value: metrics.cpuUsage
      }),
      this.storage.record('agent_memory', timestamp, {
        agentId,
        value: metrics.memoryUsage
      }),
      this.storage.record('agent_latency', timestamp, {
        agentId,
        value: metrics.averageLatency
      })
    ]);

    await this.checkThresholds(agentId, metrics);
  }

  async trackWorkflowProgress(
    workflowId: string,
    progress: WorkflowProgress
  ): Promise<void> {
    const metrics = this.calculateWorkflowMetrics(progress);
    
    await this.storage.record('workflow_progress', Date.now(), {
      workflowId,
      ...metrics
    });

    if (metrics.errorRate > 0.1) {
      await this.alerting.raise({
        level: 'warning',
        source: 'workflow',
        message: `High error rate detected in workflow ${workflowId}`,
        context: metrics
      });
    }
  }

  private calculateWorkflowMetrics(
    progress: WorkflowProgress
  ): WorkflowMetrics {
    const totalTasks = progress.tasks.length;
    const completedTasks = progress.tasks.filter(t => t.status === 'completed').length;
    const failedTasks = progress.tasks.filter(t => t.status === 'failed').length;
    
    return {
      completionRate: completedTasks / totalTasks,
      errorRate: failedTasks / totalTasks,
      averageDuration: this.calculateAverageDuration(progress.tasks),
      resourceUtilization: this.calculateResourceUtilization(progress)
    };
  }

  private async checkThresholds(
    agentId: string,
    metrics: AgentMetrics
  ): Promise<void> {
    const thresholds = await this.loadThresholds(agentId);
    
    for (const [metric, threshold] of Object.entries(thresholds)) {
      const value = metrics[metric as keyof AgentMetrics];
      
      if (value > threshold.critical) {
        await this.alerting.raise({
          level: 'critical',
          source: 'agent',
          message: `Critical threshold exceeded for ${metric} on agent ${agentId}`,
          context: { metric, value, threshold: threshold.critical }
        });
      } else if (value > threshold.warning) {
        await this.alerting.raise({
          level: 'warning',
          source: 'agent',
          message: `Warning threshold exceeded for ${metric} on agent ${agentId}`,
          context: { metric, value, threshold: threshold.warning }
        });
      }
    }
  }

  private calculateAverageDuration(tasks: WorkflowTask[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    return completedTasks.reduce(
      (sum, task) => sum + (task.duration || 0),
      0
    ) / completedTasks.length;
  }

  private calculateResourceUtilization(progress: WorkflowProgress): number {
    const allocatedResources = progress.resourceLimits;
    const availableResources = progress.resourceLimits;
    
    return Object.entries(allocatedResources).reduce(
      (total, [resource, allocated]) => 
        total + (allocated / availableResources[resource]),
      0
    ) / Object.keys(allocatedResources).length;
  }

  async trackTraeMetrics(metrics: TraeMetrics): Promise<void> {
    const timestamp = Date.now();
    
    await Promise.all([
      this.storage.record('trae_response_time', timestamp, {
        value: metrics.responseTime
      }),
      this.storage.record('trae_memory_usage', timestamp, {
        value: metrics.memoryUsage
      }),
      this.storage.record('trae_task_count', timestamp, {
        value: metrics.activeTasks
      }),
      this.storage.record('trae_success_rate', timestamp, {
        value: metrics.successRate
      })
    ]);

    await this.checkTraeThresholds(metrics);
  }

  private async checkTraeThresholds(metrics: TraeMetrics): Promise<void> {
    if (metrics.responseTime > 5000) { // 5s threshold
      await this.alerting.raise({
        level: 'warning',
        source: 'trae',
        message: 'High response time detected',
        context: metrics
      });
    }

    if (metrics.successRate < 0.9) { // 90% success rate threshold
      await this.alerting.raise({
        level: 'error',
        source: 'trae',
        message: 'Low success rate detected',
        context: metrics
      });
    }
  }

  async trackLLMMetrics(metrics: LLMMetrics): Promise<void> {
    const timestamp = Date.now();
    
    await Promise.all([
      this.storage.record('trae_llm_latency', timestamp, {
        value: metrics.latency
      }),
      this.storage.record('trae_llm_requests', timestamp, {
        value: metrics.activeRequests
      }),
      this.storage.record('trae_llm_errors', timestamp, {
        value: metrics.errorCount
      })
    ]);

    // Alert on high latency
    if (metrics.latency > 2000) { // 2s threshold
      await this.alerting.raise({
        level: 'warning',
        source: 'trae-llm',
        message: 'High LLM response time detected',
        context: metrics
      });
    }

    // Alert on high error rate
    if (metrics.errorRate > 0.1) { // 10% threshold
      await this.alerting.raise({
        level: 'error',
        source: 'trae-llm',
        message: 'High LLM error rate detected',
        context: metrics
      });
    }
  }

  private async loadThresholds(agentId: string): Promise<any> {
    // Implementation for loading thresholds
    return {
      cpuUsage: { warning: 80, critical: 95 },
      memoryUsage: { warning: 80, critical: 95 },
      averageLatency: { warning: 1000, critical: 2000 }
    };
  }
}
