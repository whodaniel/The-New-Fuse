import { WorkflowExecution, WorkflowExecutionStatus, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
export declare class WorkflowExecutionRepository extends BaseRepository<WorkflowExecution, Prisma.WorkflowExecutionCreateInput, Prisma.WorkflowExecutionUpdateInput, Prisma.WorkflowExecutionWhereInput> {
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    findById(id: string): Promise<WorkflowExecution | null>;
    findMany(filters?: Prisma.WorkflowExecutionWhereInput): Promise<WorkflowExecution[]>;
    create(data: Prisma.WorkflowExecutionCreateInput): Promise<WorkflowExecution>;
    update(id: string, data: Partial<WorkflowExecution>): Promise<WorkflowExecution>;
    delete(id: string): Promise<WorkflowExecution>;
    findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]>;
    findByStatus(status: WorkflowExecutionStatus): Promise<WorkflowExecution[]>;
    updateStatus(id: string, status: WorkflowExecutionStatus, output?: any, error?: string): Promise<WorkflowExecution>;
    getRunningExecutions(): Promise<WorkflowExecution[]>;
    getPendingExecutions(): Promise<WorkflowExecution[]>;
    getExecutionStats(workflowId?: string): Promise<{
        total: number;
        completed: number;
        failed: number;
        successRate: number;
        failureRate: number;
        avgExecutionTimeMs: number;
        byStatus: Record<string, number>;
    }>;
    getRecentExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
    getLongRunningExecutions(thresholdMinutes?: number): Promise<WorkflowExecution[]>;
    cancelExecution(id: string): Promise<WorkflowExecution>;
    retryExecution(id: string): Promise<WorkflowExecution>;
    getExecutionHistory(workflowId: string, limit?: number): Promise<WorkflowExecution[]>;
}
//# sourceMappingURL=workflow-execution.repository.d.ts.map