import { DatabaseService } from '@the-new-fuse/database';
import { CreateWorkflowDto, Workflow, WorkflowExecution, WorkflowInput } from '@the-new-fuse/types';
import { WorkflowEngine, WorkflowExecutor } from '../types/core';
export declare class WorkflowService {
    private readonly db;
    private readonly workflowEngine;
    private readonly workflowExecutor;
    private readonly logger;
    constructor(db: DatabaseService, workflowEngine: WorkflowEngine, workflowExecutor: WorkflowExecutor);
    createWorkflow(data: CreateWorkflowDto): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    getWorkflows(creatorId: string, options?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<{
        workflows: Workflow[];
        total: number;
    }>;
    executeWorkflow(workflowId: string, input?: WorkflowInput): Promise<WorkflowExecution>;
    getExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
    getExecutions(workflowId?: string, options?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        executions: WorkflowExecution[];
        total: number;
    }>;
    updateWorkflow(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    cancelExecution(executionId: string): Promise<WorkflowExecution | null>;
    pauseExecution(executionId: string): Promise<WorkflowExecution | null>;
    resumeExecution(executionId: string): Promise<WorkflowExecution | null>;
    validateWorkflow(workflow: any): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=workflow.service.d.ts.map