import { EnhancedCommunicationBus } from './enhanced_communication.js';
export interface WorkflowTemplate {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    steps: WorkflowStep[];
    metadata?: Record<string, unknown>;
}
export interface WorkflowStep {
    name: string;
    type: string;
    parameters: Record<string, unknown>;
    dependencies?: string[];
    retryPolicy?: RetryPolicy;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
}
export type WorkflowStatus = {
    id: string;
    templateName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    currentStep?: string;
    error?: string;
    startTime: string;
    endTime?: string;
    metadata?: Record<string, unknown>;
};
export declare class WorkflowManager {
    private readonly workflows;
    private readonly templates;
    private readonly commBus;
    constructor(commBus: EnhancedCommunicationBus);
    createWorkflow(templateName: string, parameters: Record<string, unknown>): Promise<string>;
    cancelWorkflow(workflowId: string): Promise<boolean>;
    getWorkflowStatus(workflowId: string): WorkflowStatus;
    registerTemplate(template: WorkflowTemplate): void;
    private generateWorkflowId;
    private startWorkflow;
    private executeStep;
}
