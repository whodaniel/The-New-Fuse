import { EventEmitter2 } from '@nestjs/event-emitter';
export interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    config?: Record<string, any>;
    dependencies?: string[];
}
export interface Workflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
    status: 'pending' | 'running' | 'completed' | 'failed';
}
export interface WorkflowExecutionResult {
    workflowId: string;
    status: 'success' | 'failure';
    results: Record<string, any>;
    errors?: string[];
    duration: number;
}
export declare class WorkflowExecutor {
    private eventEmitter;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    execute(workflow: Workflow): Promise<WorkflowExecutionResult>;
    private executeStep;
    validateWorkflow(workflow: Workflow): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=workflow-executor.d.ts.map