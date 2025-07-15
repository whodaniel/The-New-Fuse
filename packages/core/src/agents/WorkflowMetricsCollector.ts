import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';

export type WorkflowStatus = 
  | 'pending'
  | 'running' 
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export type TaskType = 
  | 'data_processing'
  | 'ml_inference'
  | 'api_call'
  | 'notification'
  | 'validation'
  | 'transformation'
  | 'custom';

export interface WorkflowMetrics {
  workflowId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    network: number;
  };
  errorCount: number;
  throughput: number;
  lastUpdated: Date;
}

export interface TaskMetrics {
  taskId: string;
  workflowId: string;
  taskType: TaskType;
  status: TaskStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  retryCount: number;
  errorMessage?: string;
  resourceUsage: {
    cpu: number;
    memory: number;
  };
}

export interface MetricsEvent {
  type: 'workflow_initialized' | 'workflow_status_updated' | 'task_metrics_added' | 
        'resource_utilization_updated' | 'error_recorded' | 'workflow_finalized';
  workflowId: string;
  timestamp: Date;
  data: any;
}

@Injectable()
export class WorkflowMetricsCollector {
  private readonly logger: Logger;
  private workflowMetrics = new Map<string, WorkflowMetrics>();
  private taskMetrics = new Map<string, TaskMetrics[]>();

  constructor() {
    this.logger = new Logger({ 
      level: 'info',
      format: Logger.format.json(),
      transports: [
        new Logger.transports.Console()
      ]
    });
  }

  async initializeWorkflowMetrics(workflowId: string, totalTasks: number): Promise<void> {
    const metrics: WorkflowMetrics = {
      workflowId,
      status: 'pending',
      startTime: new Date(),
      totalTasks,
      completedTasks: 0,
      failedTasks: 0,
      resourceUtilization: { cpu: 0, memory: 0, network: 0 },
      errorCount: 0,
      throughput: 0,
      lastUpdated: new Date()
    };

    this.workflowMetrics.set(workflowId, metrics);
    
    await this.processMetricsEvent({
      type: 'workflow_initialized',
      workflowId,
      timestamp: new Date(),
      data: { totalTasks }
    });
    
    this.logger.info('Workflow metrics initialized', { workflowId });
  }

  async updateWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
    const metrics = this.workflowMetrics.get(workflowId);
    if (!metrics) {
      this.logger.warn('Workflow metrics not found', { workflowId });
      return;
    }

    metrics.status = status;
    metrics.lastUpdated = new Date();

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      metrics.endTime = new Date();
      metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
    }

    await this.processMetricsEvent({
      type: 'workflow_status_updated',
      workflowId,
      timestamp: new Date(),
      data: { status, duration: metrics.duration }
    });

    this.logger.info('Workflow status updated', { workflowId, status });
  }

  async addTaskMetrics(taskMetrics: TaskMetrics): Promise<void> {
    const workflowTasks = this.taskMetrics.get(taskMetrics.workflowId) || [];
    workflowTasks.push(taskMetrics);
    this.taskMetrics.set(taskMetrics.workflowId, workflowTasks);

    const workflowMetrics = this.workflowMetrics.get(taskMetrics.workflowId);
    if (!workflowMetrics) {
      this.logger.warn('Workflow metrics not found for task', { 
        workflowId: taskMetrics.workflowId, 
        taskId: taskMetrics.taskId 
      });
      return;
    }

    if (taskMetrics.status === 'completed') {
      workflowMetrics.completedTasks++;
    } else if (taskMetrics.status === 'failed') {
      workflowMetrics.failedTasks++;
    }

    workflowMetrics.lastUpdated = new Date();

    await this.processMetricsEvent({
      type: 'task_metrics_added',
      workflowId: taskMetrics.workflowId,
      timestamp: new Date(),
      data: { taskId: taskMetrics.taskId, status: taskMetrics.status }
    });

    this.logger.debug('Task metrics added', { 
      workflowId: taskMetrics.workflowId, 
      taskId: taskMetrics.taskId 
    });
  }

  async updateResourceUtilization(
    workflowId: string, 
    utilization: { cpu: number; memory: number; network: number }
  ): Promise<void> {
    const metrics = this.workflowMetrics.get(workflowId);
    if (!metrics) {
      this.logger.warn('Workflow metrics not found for resource update', { workflowId });
      return;
    }

    metrics.resourceUtilization = utilization;
    metrics.lastUpdated = new Date();

    await this.processMetricsEvent({
      type: 'resource_utilization_updated',
      workflowId,
      timestamp: new Date(),
      data: utilization
    });
  }

  async recordError(workflowId: string, error: string): Promise<void> {
    const metrics = this.workflowMetrics.get(workflowId);
    if (!metrics) {
      this.logger.warn('Workflow metrics not found for error recording', { workflowId });
      return;
    }

    metrics.errorCount++;
    metrics.lastUpdated = new Date();

    await this.processMetricsEvent({
      type: 'error_recorded',
      workflowId,
      timestamp: new Date(),
      data: { error, errorCount: metrics.errorCount }
    });

    this.logger.error('Workflow error recorded', { workflowId, error });
  }

  async finalizeWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics | null> {
    const metrics = this.workflowMetrics.get(workflowId);
    if (!metrics) {
      this.logger.warn('Workflow metrics not found for finalization', { workflowId });
      return null;
    }

    if (!metrics.endTime) {
      metrics.endTime = new Date();
      metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
    }

    // Calculate throughput (tasks per minute)
    if (metrics.duration && metrics.duration > 0) {
      metrics.throughput = (metrics.completedTasks / (metrics.duration / 60000));
    }

    await this.processMetricsEvent({
      type: 'workflow_finalized',
      workflowId,
      timestamp: new Date(),
      data: { 
        duration: metrics.duration,
        throughput: metrics.throughput,
        completedTasks: metrics.completedTasks,
        failedTasks: metrics.failedTasks
      }
    });

    this.logger.info('Workflow metrics finalized', { 
      workflowId,
      duration: metrics.duration,
      throughput: metrics.throughput
    });

    return metrics;
  }

  getWorkflowMetrics(workflowId: string): WorkflowMetrics | undefined {
    return this.workflowMetrics.get(workflowId);
  }

  getTaskMetrics(workflowId: string): TaskMetrics[] {
    return this.taskMetrics.get(workflowId) || [];
  }

  getAllWorkflowMetrics(): WorkflowMetrics[] {
    return Array.from(this.workflowMetrics.values());
  }

  private async processMetricsEvent(event: MetricsEvent): Promise<void> {
    // This would integrate with a metrics processing system
    // For now, just log the event
    this.logger.debug('Processing metrics event', { 
      type: event.type, 
      workflowId: event.workflowId 
    });
  }

  clearMetrics(workflowId: string): void {
    this.workflowMetrics.delete(workflowId);
    this.taskMetrics.delete(workflowId);
    this.logger.info('Metrics cleared for workflow', { workflowId });
  }

  clearAllMetrics(): void {
    this.workflowMetrics.clear();
    this.taskMetrics.clear();
    this.logger.info('All workflow metrics cleared');
  }
}