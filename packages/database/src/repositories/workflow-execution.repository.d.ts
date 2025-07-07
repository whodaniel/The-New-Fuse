import { WorkflowExecution, WorkflowExecutionStatus } from '../types';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
export declare class WorkflowExecutionRepository extends BaseRepository<WorkflowExecution> {
    constructor(prisma: PrismaService);
    private convertPrismaToApp;
    findById(id: string): Promise<WorkflowExecution | null>;
    findMany(filters?: any): Promise<WorkflowExecution[]>;
    create(data: any): Promise<WorkflowExecution>;
    update(id: string, data: any): Promise<WorkflowExecution>;
    delete(id: string): Promise<WorkflowExecution>;
    findOne(filter?: any, include?: any): Promise<WorkflowExecution | null>;
    findAll(filter?: any, orderBy?: any, skip?: number, take?: number): Promise<WorkflowExecution[]>;
    count(filter?: any): Promise<number>;
    protected countTotal(where: any): Promise<number>;
    findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]>;
    findByStatus(status: WorkflowExecutionStatus): Promise<WorkflowExecution[]>;
    updateStatus(id: string, status: WorkflowExecutionStatus, output?: any, error?: string): Promise<WorkflowExecution>;
    getRunningExecutions(): Promise<WorkflowExecution[]>;
    getPendingExecutions(): Promise<WorkflowExecution[]>;
    getExecutionStats(workflowId?: string): Promise<any>;
    getRecentExecutions(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
    getLongRunningExecutions(thresholdMinutes?: number): Promise<WorkflowExecution[]>;
    cancelExecution(id: string): Promise<WorkflowExecution>;
    retryExecution(id: string): Promise<WorkflowExecution>;
    getExecutionHistory(workflowId: string, limit?: number): Promise<WorkflowExecution[]>;
}
//# sourceMappingURL=workflow-execution.repository.d.ts.map