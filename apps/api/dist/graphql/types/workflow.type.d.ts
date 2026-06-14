import { UserType } from './user.type';
import { WorkflowStepType } from './workflow-step.type';
export declare enum WorkflowStatus {
    IDLE = "IDLE",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    PAUSED = "PAUSED"
}
export declare class WorkflowStatisticsType {
    averageExecutionTime?: number;
    successRate?: number;
    lastExecutionStatus?: string;
}
export declare class WorkflowType {
    id: string;
    name: string;
    description?: string;
    creator?: UserType;
    steps?: WorkflowStepType[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastExecutedAt?: Date;
    executionCount: number;
    statistics?: WorkflowStatisticsType;
    variables?: string;
    triggers?: string;
    metadata?: string;
    status: WorkflowStatus;
}
//# sourceMappingURL=workflow.type.d.ts.map