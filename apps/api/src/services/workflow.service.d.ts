import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity.tsx';
import { WorkflowEngine, WorkflowExecutor } from '@the-new-fuse/core';
import { CreateWorkflowDto, WorkflowExecutionStatus, WorkflowInput } from '@the-new-fuse/types';
export declare class WorkflowService {
    private readonly workflowRepository;
    private readonly workflowEngine;
    private readonly workflowExecutor;
    constructor(workflowRepository: Repository<Workflow>, workflowEngine: WorkflowEngine, workflowExecutor: WorkflowExecutor);
    createWorkflow(data: CreateWorkflowDto): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow>;
    getWorkflows(): Promise<Workflow[]>;
    executeWorkflow(workflowId: string, input: WorkflowInput): Promise<string>;
    getExecutionStatus(executionId: string): Promise<WorkflowExecutionStatus>;
    updateWorkflow(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<void>;
    handleWorkflowResult(_result: WorkflowExecutionStatus): void;
}
