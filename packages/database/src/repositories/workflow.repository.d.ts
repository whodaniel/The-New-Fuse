import { Workflow, WorkflowStatus } from '../types';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
export declare class WorkflowRepository extends BaseRepository<Workflow> {
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    private convertExecutionPrismaToApp;
    findById(id: string): Promise<Workflow | null>;
    findMany(filters?: any): Promise<Workflow[]>;
    create(data: any): Promise<Workflow>;
    update(id: string, data: any): Promise<Workflow>;
    delete(id: string): Promise<Workflow>;
    findOne(filter?: any, include?: any): Promise<Workflow | null>;
    findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<Workflow[]>;
    count(filter?: any): Promise<number>;
    protected countTotal(where: any): Promise<number>;
    findByUserId(_userId: string): Promise<Workflow[]>;
    findByAgentId(_agentId: string): Promise<Workflow[]>;
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