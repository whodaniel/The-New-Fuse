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

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  network: number;
}

export interface WorkflowMetrics {
  workflowId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  resourceUtilization: ResourceUtilization;
  errorCount: number;
  throughput: number;
  lastUpdated: Date;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
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
  resourceUsage: ResourceUsage;
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
    
    this.logger.info('Workflow metrics initialized', { workflowId, totalTasks });
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
      
      // Calculate throughput (tasks per minute)
      if (metrics.duration > 0) {
        metrics.throughput = (metrics.completedTasks / (metrics.duration / 1000 / 60));
      }
    }

    await this.processMetricsEvent({
      type: 'workflow_status_updated',
      workflowId,
      timestamp: new Date(),
      data: { status, duration: metrics.duration }
    });

    this.logger.info('Workflow status updated', { workflowId, status });
  }

  async recordTaskMetrics(taskMetrics: TaskMetrics): Promise<void> {
    const { workflowId, taskId } = taskMetrics;
    
    if (!this.taskMetrics.has(workflowId)) {
      this.taskMetrics.set(workflowId, []);
    }
    
    const workflowTaskMetrics = this.taskMetrics.get(workflowId)!;
    const existingIndex = workflowTaskMetrics.findIndex(t => t.taskId === taskId);
    
    if (existingIndex >= 0) {
      workflowTaskMetrics[existingIndex] = taskMetrics;
    } else {
      workflowTaskMetrics.push(taskMetrics);
    }

    await this.updateWorkflowMetricsFromTask(taskMetrics);
    
    await this.processMetricsEvent({
      type: 'task_metrics_added',
      workflowId,
      timestamp: new Date(),
      data: taskMetrics
    });

    this.logger.debug('Task metrics recorded', { workflowId, taskId, status: taskMetrics.status });
  }

  private async updateWorkflowMetricsFromTask(taskMetrics: TaskMetrics): Promise<void> {
    const workflowMetrics = this.workflowMetrics.get(taskMetrics.workflowId);
    if (!workflowMetrics) {
      return;
    }

    // Update task counts based on task status
    if (taskMetrics.status === 'completed') {
      workflowMetrics.completedTasks++;
    } else if (taskMetrics.status === 'failed') {
      workflowMetrics.failedTasks++;
    }

    // Update resource utilization
    workflowMetrics.resourceUtilization.cpu += taskMetrics.resourceUsage.cpu;
    workflowMetrics.resourceUtilization.memory += taskMetrics.resourceUsage.memory;

    // Record error if task failed
    if (taskMetrics.status === 'failed' && taskMetrics.errorMessage) {
      workflowMetrics.errorCount++;
      await this.processMetricsEvent({
        type: 'error_recorded',
        workflowId: taskMetrics.workflowId,
        timestamp: new Date(),
        data: { taskId: taskMetrics.taskId, error: taskMetrics.errorMessage }
      });
    }

    workflowMetrics.lastUpdated = new Date();
  }

  async updateResourceUtilization(workflowId: string, utilization: ResourceUtilization): Promise<void> {
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

    this.logger.debug('Resource utilization updated', { workflowId, utilization });
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

    // Final throughput calculation
    if (metrics.duration > 0) {
      metrics.throughput = (metrics.completedTasks / (metrics.duration / 1000 / 60));
    }

    await this.processMetricsEvent({
      type: 'workflow_finalized',
      workflowId,
      timestamp: new Date(),
      data: metrics
    });

    this.logger.info('Workflow metrics finalized', { 
      workflowId, 
      duration: metrics.duration,
      completedTasks: metrics.completedTasks,
      failedTasks: metrics.failedTasks,
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

  async generateMetricsReport(workflowId: string): Promise<any> {
    const workflowMetrics = this.getWorkflowMetrics(workflowId);
    const taskMetrics = this.getTaskMetrics(workflowId);

    if (!workflowMetrics) {
      return null;
    }

    return {
      workflow: workflowMetrics,
      tasks: taskMetrics,
      summary: {
        successRate: workflowMetrics.totalTasks > 0 
          ? (workflowMetrics.completedTasks / workflowMetrics.totalTasks) * 100 
          : 0,
        avgTaskDuration: taskMetrics.length > 0 
          ? taskMetrics.reduce((sum, task) => sum + (task.duration || 0), 0) / taskMetrics.length
          : 0,
        totalRetries: taskMetrics.reduce((sum, task) => sum + task.retryCount, 0),
        resourceEfficiency: {
          avgCpu: taskMetrics.length > 0 
            ? taskMetrics.reduce((sum, task) => sum + task.resourceUsage.cpu, 0) / taskMetrics.length
            : 0,
          avgMemory: taskMetrics.length > 0 
            ? taskMetrics.reduce((sum, task) => sum + task.resourceUsage.memory, 0) / taskMetrics.length
            : 0
        }
      }
    };
  }

  private async processMetricsEvent(event: MetricsEvent): Promise<void> {
    // This is where you would send metrics to external systems
    // like Prometheus, DataDog, CloudWatch, etc.
    this.logger.debug('Processing metrics event', { 
      type: event.type, 
      workflowId: event.workflowId,
      timestamp: event.timestamp
    });
  }

  async cleanup(workflowId: string): Promise<void> {
    this.workflowMetrics.delete(workflowId);
    this.taskMetrics.delete(workflowId);
    this.logger.info('Workflow metrics cleaned up', { workflowId });
  }
}