import { EventEmitter } from 'events';
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'task' | 'condition' | 'parallel' | 'sequence';
    agentId?: string;
    parameters?: Record<string, unknown>;
    dependencies?: string[];
    conditions?: Record<string, unknown>;
}
export interface WorkflowState {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    steps: WorkflowStep[];
    currentStep?: string;
    completedSteps: string[];
    failedSteps: string[];
    startTime?: Date;
    endTime?: Date;
    error?: string;
}
export declare class AgentWorkflowManager extends EventEmitter {
    private readonly logger;
    private readonly workflows;
    constructor();
    createWorkflow(workflowId: string, name: string, steps: WorkflowStep[]): WorkflowState;
    startWorkflow(workflowId: string): Promise<void>;
    pauseWorkflow(workflowId: string): Promise<void>;
    cancelWorkflow(workflowId: string): Promise<void>;
    getWorkflow(workflowId: string): WorkflowState | undefined;
    getAllWorkflows(): WorkflowState[];
    private executeWorkflow;
    private executeStep;
    private executeAgentTask;
    private evaluateCondition;
    private executeParallel;
    private executeSequence;
}
//# sourceMappingURL=AgentWorkflowManager.d.ts.map