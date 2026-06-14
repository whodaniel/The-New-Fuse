import type { User, Workflow } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import { UserLoader } from '../loaders/user.loader';
import { WorkflowLoader } from '../loaders/workflow.loader';
import { CreateWorkflowInput, ExecuteWorkflowInput } from '../types/input.types';
import { WorkflowStatus } from '../types/workflow.type';
type WorkflowStep = any;
export declare class WorkflowResolver {
    private readonly db;
    private readonly userLoader;
    private readonly workflowLoader;
    constructor(db: DatabaseService, userLoader: UserLoader, workflowLoader: WorkflowLoader);
    workflow(id: string): Promise<Workflow | null>;
    workflows(userIdArg?: string, context?: any): Promise<Workflow[]>;
    createWorkflow(input: CreateWorkflowInput, context: any): Promise<Workflow>;
    executeWorkflow(input: ExecuteWorkflowInput, context: any): Promise<Workflow>;
    creator(workflow: Workflow): Promise<User | null>;
    steps(workflow: Workflow): Promise<WorkflowStep[]>;
    status(workflow: Workflow): WorkflowStatus;
    variables(workflow: Workflow): string | null;
    triggers(workflow: Workflow): string | null;
    metadata(workflow: Workflow): string | null;
}
export {};
//# sourceMappingURL=workflow.resolver.d.ts.map