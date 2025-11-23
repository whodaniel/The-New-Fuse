import { PrismaService } from '../services/prisma.service';
import { WorkflowEngine, WorkflowExecutor } from '../types/core';
import { CreateWorkflowDto, WorkflowInput, WorkflowExecutionStatus, Workflow } from '@the-new-fuse/types';
export declare class WorkflowService {
    private readonly prisma;
    private readonly workflowEngine;
    private readonly workflowExecutor;
    private readonly logger;
    constructor(prisma: PrismaService, workflowEngine: WorkflowEngine, workflowExecutor: WorkflowExecutor);
    createWorkflow(data: CreateWorkflowDto): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    getWorkflows(options?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<{
        workflows: Workflow[];
        total: number;
    }>;
    executeWorkflow(workflowId: string, input?: WorkflowInput): Promise<WorkflowExecutionStatus>;
    getExecutionStatus(executionId: string): Promise<WorkflowExecutionStatus | null>;
    getExecutions(workflowId?: string, options?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        executions: WorkflowExecutionStatus[];
        total: number;
    }>;
    updateWorkflow(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    cancelExecution(executionId: string): Promise<WorkflowExecutionStatus | null>;
    pauseExecution(executionId: string): Promise<WorkflowExecutionStatus | null>;
    resumeExecution(executionId: string): Promise<WorkflowExecutionStatus | null>;
    validateWorkflow(workflow: any): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=workflow.service.d.ts.map