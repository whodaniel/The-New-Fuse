import { WorkflowStep, WorkflowMetrics } from '../types.js';
export declare class WorkflowMetricsTracker {
    private startTime;
    private metrics;
    constructor();
    initializeWorkflow(steps: WorkflowStep[]): void;
    recordStepCompletion(stepId: string, success: boolean): void;
    private updateExecutionTime;
    getMetrics(): WorkflowMetrics;
    getProgress(): number;
}
