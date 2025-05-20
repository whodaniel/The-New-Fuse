import { MetricsProcessor } from '../security/metricsProcessor.js';
import { WorkflowState } from './types.js';
export interface WorkflowMetrics {
    workflowId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    taskMetrics: TaskMetrics[];
    status: WorkflowState['status'];
    resourceUtilization: ResourceMetrics;
    errors?: WorkflowError[];
}
export interface TaskMetrics {
    taskId: string;
    type: TaskType;
    startTime: number;
    endTime?: number;
    duration?: number;
    attempts: number;
    status: pending' | 'running' | 'completed' | 'failed';
    resourceUtilization: ResourceMetrics;
}
export interface ResourceMetrics {
    memoryUsage: number;
    cpuUsage: number;
    gpuUsage?: number;
    networkIO: {
        bytesIn: number;
        bytesOut: number;
    };
}
export declare class WorkflowMetricsCollector {
    private readonly metricsProcessor;
    private activeWorkflows;
    constructor(metricsProcessor: MetricsProcessor);
    initializeWorkflowMetrics(): Promise<void>;
}
