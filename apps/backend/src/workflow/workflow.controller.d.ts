export declare class WorkflowController {
    private logger;
    constructor();
    getWorkflows(req: any): Promise<never[]>;
    getWorkflowById(id: string, req: any): Promise<{
        id: string;
    }>;
    createWorkflow(workflowData: any, req: any): Promise<any>;
    updateWorkflow(id: string, workflowData: any, req: any): Promise<any>;
    deleteWorkflow(id: string, req: any): Promise<{
        success: boolean;
    }>;
    executeWorkflow(id: string, executionData: any, req: any): Promise<{
        executionId: string;
        workflowId: string;
        status: string;
    }>;
    getWorkflowExecutions(id: string, req: any): Promise<never[]>;
}
//# sourceMappingURL=workflow.controller.d.ts.map