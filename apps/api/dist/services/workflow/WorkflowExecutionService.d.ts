import { DatabaseService } from '@the-new-fuse/database';
export declare class WorkflowExecutionService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    /**
     * Run a workflow execution with best-effort node orchestration.
     */
    run(executionId: string, definition: any, input?: any): Promise<void>;
    private getNodeTypeLabel;
    private classifyNode;
    private resolveNodeConfig;
    private resolveNodeInput;
    private executeNode;
    private executeWebhookTriggerNode;
    private executeHttpNode;
    private executeConditionNode;
    private executeGenericNode;
    private readPath;
    private compareCondition;
}
//# sourceMappingURL=WorkflowExecutionService.d.ts.map