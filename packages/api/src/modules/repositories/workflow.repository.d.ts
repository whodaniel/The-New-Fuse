import { PrismaService } from '../prisma/prisma.service';
import { Workflow, WorkflowStatus } from '@the-new-fuse/types';
export declare class WorkflowRepository {
    protected readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    findById(id: string): Promise<Workflow | null>;
    findMany(filters?: any): Promise<Workflow[]>;
    create(data: any): Promise<Workflow>;
    update(id: string, data: any): Promise<Workflow>;
    delete(id: string): Promise<Workflow>;
    findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<Workflow[]>;
    findOne(filter?: any, include?: any): Promise<Workflow | null>;
    count(filter?: any): Promise<number>;
    protected countTotal(where: any): Promise<number>;
    findByStatus(status: WorkflowStatus): Promise<Workflow[]>;
    findByUserId(userId: string): Promise<Workflow[]>;
    updateStatus(id: string, status: WorkflowStatus): Promise<Workflow>;
    searchWorkflows(query: string): Promise<Workflow[]>;
}
//# sourceMappingURL=workflow.repository.d.ts.map