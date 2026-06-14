/**
 * Workflow Controller - Production ready REST API for workflow management
 */
import { DatabaseService } from '@the-new-fuse/database';
import { Request, Response } from 'express';
import { WorkflowExecutionService } from '../services/workflow/WorkflowExecutionService';
export declare class WorkflowController {
    private readonly db;
    private readonly executionService;
    private logger;
    constructor(db: DatabaseService, executionService: WorkflowExecutionService);
    getWorkflows(query: any, res: Response): Promise<void>;
    getWorkflow(id: string, res: Response): Promise<void>;
    createWorkflow(workflowData: any, res: Response, req: any): Promise<void>;
    updateWorkflow(id: string, updates: any, res: Response): Promise<void>;
    publishWorkflow(id: string, res: Response): Promise<void>;
    deleteWorkflow(id: string, res: Response): Promise<void>;
    executeWorkflow(body: any, res: Response): Promise<void>;
    executeWorkflowViaWebhook(workflowId: string, payload: any, headers: Record<string, string | string[]>, res: Response): Promise<void>;
    executeWorkflowViaWebhookTrigger(workflowId: string, triggerId: string, payload: any, headers: Record<string, string | string[]>, res: Response): Promise<void>;
    getExecution(executionId: string, res: Response): Promise<void>;
    getExecutions(query: any, res: Response): Promise<void>;
    cancelExecution(executionId: string, res: Response): Promise<void>;
    pauseExecution(executionId: string, res: Response): Promise<void>;
    resumeExecution(executionId: string, res: Response): Promise<void>;
    validateWorkflow(workflow: any, res: Response): Promise<void>;
    getTemplates(_req: Request, res: Response): Promise<void>;
    getTemplate(id: string, res: Response): Promise<void>;
    createFromTemplate(body: any, res: Response): Promise<void>;
    private handleWorkflowWebhookExecution;
    private resolveWebhookTrigger;
    private evaluateTriggerCondition;
    private readPath;
    private getTriggerSecret;
    private readHeader;
    private pickHeaderSubset;
}
//# sourceMappingURL=workflow.controller.d.ts.map