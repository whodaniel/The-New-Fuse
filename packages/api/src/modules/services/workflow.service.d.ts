import { UnifiedWorkflow } from '@the-new-fuse/workflow-engine';
import { PrismaService } from '@the-new-fuse/database';
import { CreateWorkflowDto } from '@the-new-fuse/api-types/src/workflow';
export declare class WorkflowService {
    private readonly prismaService;
    private readonly logger;
    private readonly workflowEngine;
    private readonly workflowRepository;
    constructor(prismaService: PrismaService);
    /**
     * Get all workflows for a user
     */
    getWorkflows(userId: string): Promise<UnifiedWorkflow[]>;
    /**
     * Get workflow by ID
     */
    getWorkflowById(id: string, userId: string): Promise<UnifiedWorkflow>;
    /**
     * Create a new workflow
     */
    createWorkflow(data: CreateWorkflowDto, userId: string): Promise<UnifiedWorkflow>;
    catch(error: any): void;
}
//# sourceMappingURL=workflow.service.d.ts.map