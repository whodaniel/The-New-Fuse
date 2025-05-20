import { WorkflowStep, ExecutionResult } from '../types.js';
import { WorkflowMetricsTracker } from './WorkflowExecutor.js';

export declare class WorkflowExecutor {
    private context;
    private metricsTracker;
    constructor(metricsTracker: WorkflowMetricsTracker);
    executeWorkflow(steps: WorkflowStep[]): Promise<ExecutionResult>;
}
