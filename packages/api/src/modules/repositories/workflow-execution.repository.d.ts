import { PrismaService } from '../prisma/prisma.service';
import { WorkflowExecution } from '@the-new-fuse/types';
export declare class WorkflowExecutionRepository {
    protected readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    findById(id: string): Promise<WorkflowExecution | null>;
    findMany(filters?: any): Promise<WorkflowExecution[]>;
    create(data: any): Promise<WorkflowExecution>;
    update(id: string, data: any): Promise<WorkflowExecution>;
    delete(id: string): Promise<WorkflowExecution>;
    findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<WorkflowExecution[]>;
    findOne(filter?: any, include?: any): Promise<WorkflowExecution | null>;
    count(filter?: any): Promise<number>;
    protected countTotal(where: any): Promise<number>;
    findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]>;
    findByStatus(status: string): Promise<WorkflowExecution[]>;
    findByUserId(userId: string): Promise<WorkflowExecution[]>;
    updateStatus(id: string, status: string, output?: any, error?: string): Promise<WorkflowExecution>;
    getRunningExecutions(): Promise<WorkflowExecution[]>;
    getPendingExecutions(): Promise<WorkflowExecution[]>;
    cancelExecution(id: string): Promise<WorkflowExecution>;
    getExecutionHistory(workflowId: string, limit?: number): Promise<WorkflowExecution[]>;
}
//# sourceMappingURL=workflow-execution.repository.d.ts.map