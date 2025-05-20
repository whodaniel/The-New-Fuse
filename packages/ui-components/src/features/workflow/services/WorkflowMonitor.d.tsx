import { EventEmitter } from 'events';
import { WorkflowStep, WorkflowMetrics } from '../types.js';
export declare class WorkflowMonitor extends EventEmitter {
    private static instance;
    private activeWorkflows;
    private constructor();
    static getInstance(): WorkflowMonitor;
    startMonitoring(workflowId: string, initialMetrics: WorkflowMetrics): void;
    updateMetrics(workflowId: string, metrics: Partial<WorkflowMetrics>): void;
    recordStepExecution(workflowId: string, step: WorkflowStep, success: boolean, duration: number): void;
    stopMonitoring(workflowId: string): void;
    getActiveWorkflows(): Map<string, WorkflowMetrics>;
    getWorkflowMetrics(workflowId: string): WorkflowMetrics | undefined;
}
