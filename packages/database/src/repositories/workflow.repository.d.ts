import { Workflow, WorkflowStatus, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
export declare class WorkflowRepository extends BaseRepository<Workflow, Prisma.WorkflowCreateInput, Prisma.WorkflowUpdateInput, Prisma.WorkflowWhereInput> {
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    private convertExecutionPrismaToApp;
    findById(id: string): Promise<Workflow | null>;
    findMany(filters?: Prisma.WorkflowWhereInput): Promise<Workflow[]>;
    create(data: Prisma.WorkflowCreateInput): Promise<Workflow>;
    update(id: string, data: Prisma.WorkflowUpdateInput): Promise<Workflow>;
    delete(id: string): Promise<Workflow>;
    findByUserId(userId: string): Promise<Workflow[]>;
    findByAgentId(agentId: string): Promise<Workflow[]>;
    findByStatus(status: WorkflowStatus): Promise<Workflow[]>;
    updateStatus(id: string, status: WorkflowStatus): Promise<Workflow>;
    addStep(workflowId: string, stepData: any): Promise<any>;
    removeStep(workflowId: string, stepId: string): Promise<any>;
    reorderSteps(workflowId: string, stepOrders: Array<{
        id: string;
        order: number;
    }>): Promise<void>;
    getWorkflowStats(): Promise<any>;
    searchWorkflows(query: string): Promise<Workflow[]>;
}
//# sourceMappingURL=workflow.repository.d.ts.map