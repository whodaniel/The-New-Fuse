import { WorkflowService } from '../services/workflow/WorkflowService.js';
import { Workflow, CreateWorkflowDto, UpdateWorkflowDto, WorkflowStatus } from '@the-new-fuse/types';
import { User } from '@the-new-fuse/database';
export declare class WorkflowController {
    private readonly workflowService;
    constructor(workflowService: WorkflowService);
    createWorkflow(data: CreateWorkflowDto, user: User): Promise<Workflow>;
    executeWorkflow(id: string, user: User): Promise<void>;
    getWorkflowStatus(id: string, user: User): Promise<WorkflowStatus>;
    getWorkflowResults(id: string, user: User): Promise<any>;
    updateWorkflow(id: string, updates: UpdateWorkflowDto, user: User): Promise<Workflow>;
    deleteWorkflow(id: string, user: User): Promise<void>;
}
