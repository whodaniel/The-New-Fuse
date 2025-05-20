import { WorkflowStep, WorkflowMetrics, StepMetrics } from '../types.js';

export class WorkflowMetricsTracker {
  private startTime: number;
  private metrics: WorkflowMetrics;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: 0,
      startTime: Date.now(),
      stepMetrics: {}
    };
  }

  initializeWorkflow(steps: WorkflowStep[]): void {
    this.metrics.totalSteps = steps.length;
    this.metrics.startTime = Date.now();
    this.startTime = Date.now();
    
    // Initialize step metrics
    steps.forEach(step => {
      this.metrics.stepMetrics[step.id] = {
        id: step.id,
        type: step.type,
        status: 'pending',
        attempts: 0
      };
    });
  }

  recordStepCompletion(stepId: string, success: boolean): void {
    if (success) {
      this.metrics.completedSteps++;
      if (this.metrics.stepMetrics[stepId]) {
        this.metrics.stepMetrics[stepId].status = 'completed';
        this.metrics.stepMetrics[stepId].endTime = Date.now();
        this.metrics.stepMetrics[stepId].duration = 
          (this.metrics.stepMetrics[stepId].endTime || 0) - 
          (this.metrics.stepMetrics[stepId].startTime || 0);
      }
    } else {
      this.metrics.failedSteps++;
      if (this.metrics.stepMetrics[stepId]) {
        this.metrics.stepMetrics[stepId].status = 'failed';
        this.metrics.stepMetrics[stepId].attempts++;
      }
    }
    this.updateDuration();
  }

  private updateDuration(): void {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
  }

  getMetrics(): WorkflowMetrics {
    this.updateDuration();
    return { ...this.metrics };
  }

  getProgress(): number {
    return (this.metrics.completedSteps / this.metrics.totalSteps) * 100;
  }
}