import { EventEmitter2 } from '@nestjs/event-emitter';
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'task' | 'decision' | 'parallel' | 'sequential';
    config: any;
    dependencies?: string[];
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    variables?: Record<string, any>;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    currentStep?: string;
    results: Record<string, any>;
    error?: string;
}
export interface WorkflowEventData {
    workflowId: string;
    executionId: string;
    error?: string;
}
export declare class AgentWorkflowService {
    private readonly eventEmitter;
    private readonly logger;
    private workflows;
    private executions;
    constructor(eventEmitter: EventEmitter2);
    private setupWorkflowEventListeners;
    createWorkflow(definition: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition>;
    executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<WorkflowExecution>;
    private executeSteps;
    private executeStep;
    private executeTaskStep;
    private executeDecisionStep;
    private executeParallelStep;
    private executeSequentialStep;
    pauseWorkflow(executionId: string): Promise<void>;
    cancelWorkflow(executionId: string): Promise<void>;
    getWorkflow(workflowId: string): WorkflowDefinition | undefined;
    getExecution(executionId: string): WorkflowExecution | undefined;
    getAllWorkflows(): WorkflowDefinition[];
    getAllExecutions(): WorkflowExecution[];
    getExecutionsForWorkflow(workflowId: string): WorkflowExecution[];
    deleteWorkflow(workflowId: string): Promise<boolean>;
    deleteExecution(executionId: string): Promise<boolean>;
    getWorkflowStatus(workflowId: string): {
        workflow: WorkflowDefinition | undefined;
        executions: WorkflowExecution[];
        activeExecutions: number;
    };
}
//# sourceMappingURL=agent-workflow.service.d.ts.map