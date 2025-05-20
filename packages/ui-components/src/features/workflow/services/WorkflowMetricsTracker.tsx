import { WorkflowStep } from '../types.js';

export interface WorkflowMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  stepMetrics: Record<string, StepMetrics>;
}

export interface StepMetrics {
  id: string;
  type: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
}

export class WorkflowMetricsTracker {
  private metrics: WorkflowMetrics;
  private stepMap: Map<string, WorkflowStep>;

  constructor() {
    this.metrics = {
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: 0,
      startTime: Date.now(),
      stepMetrics: {}
    };
    this.stepMap = new Map();
  }

  public initializeWorkflow(steps: WorkflowStep[]): void {
    this.metrics.totalSteps = steps.length;
    this.metrics.startTime = Date.now();
    
    // Initialize step metrics
    steps.forEach(step: WorkflowStep => {
      this.stepMap.set(step.id, step);
      this.metrics.stepMetrics[step.id] = {
        id: step.id,
        type: step.type,
        status: 'pending',
        attempts: 0
      };
    });
  }

  public recordStepStart(stepId: string): void {
    const stepMetrics = this.metrics.stepMetrics[stepId];
    if (stepMetrics) {
      stepMetrics.status = 'running';
      stepMetrics.startTime = Date.now();
      stepMetrics.attempts += 1;
    }
  }

  public recordStepCompletion(stepId: string, success: boolean): void {
    const stepMetrics = this.metrics.stepMetrics[stepId];
    if (stepMetrics) {
      stepMetrics.status = success ? 'completed' : 'failed';
      stepMetrics.endTime = Date.now();
      
      if (stepMetrics.startTime) {
        stepMetrics.duration = stepMetrics.endTime - stepMetrics.startTime;
      }
      
      if (success) {
        this.metrics.completedSteps += 1;
      } else {
        this.metrics.failedSteps += 1;
      }
    }
  }

  public recordWorkflowCompletion(): void {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
  }

  public getMetrics(): WorkflowMetrics {
    return { ...this.metrics };
  }

  public getStepMetrics(stepId: string): StepMetrics | undefined {
    return this.metrics.stepMetrics[stepId];
  }

  public reset(): void {
    this.metrics = {
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: 0,
      startTime: Date.now(),
      stepMetrics: {}
    };
    this.stepMap.clear();
  }
}
