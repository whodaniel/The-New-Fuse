import type { Workflow } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
type WorkflowStep = any;
export declare class WorkflowLoader {
    private readonly db;
    private readonly batchWorkflows;
    private readonly batchWorkflowsByUser;
    private readonly batchStepsByWorkflow;
    constructor(db: DatabaseService);
    load(workflowId: string): Promise<Workflow | null>;
    loadMany(workflowIds: string[]): Promise<(Workflow | null)[]>;
    loadByUserId(userId: string): Promise<Workflow[]>;
    loadStepsByWorkflowId(workflowId: string): Promise<WorkflowStep[]>;
}
export {};
//# sourceMappingURL=workflow.loader.d.ts.map