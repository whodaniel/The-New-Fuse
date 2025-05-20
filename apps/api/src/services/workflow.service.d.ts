import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity.js';
import { WorkflowEngine, WorkflowExecutor } from '@the-new-fuse/core';
export declare class WorkflowService {
    private readonly workflowRepository;
    private readonly workflowEngine;
    private readonly workflowExecutor;
    constructor(workflowRepository: Repository<Workflow>, workflowEngine: WorkflowEngine, workflowExecutor: WorkflowExecutor);
    createWorkflow(data: any): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow>;
    getWorkflows(): Promise<Workflow[]>;
    executeWorkflow(workflowId: string, input: any): Promise<string>;
    getExecutionStatus(executionId: string): Promise<any>;
    updateWorkflow(id: string, data: any): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<void>;
}
