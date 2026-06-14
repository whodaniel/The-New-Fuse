import { AgentType } from './agent.type';
export declare class WorkflowStepStatisticsType {
    averageExecutionTime?: number;
    successRate?: number;
    lastExecutionStatus?: string;
    errorCount?: number;
}
export declare class WorkflowStepType {
    id: string;
    name: string;
    type: string;
    agent?: AgentType;
    nextSteps: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastExecutedAt?: Date;
    statistics?: WorkflowStepStatisticsType;
    config?: string;
    conditions?: string;
    transformations?: string;
    metadata?: string;
}
//# sourceMappingURL=workflow-step.type.d.ts.map