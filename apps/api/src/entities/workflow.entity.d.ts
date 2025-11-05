import { User } from './user.entity';
import { WorkflowStep } from './workflow-step.entity';
export declare class Workflow {
    id: string;
    name: string;
    description?: string;
    creator: User;
    steps: WorkflowStep[];
    metadata: Record<string, any>;
    isActive: boolean;
    variables: Record<string, any>;
    triggers: Record<string, any>[];
    createdAt: Date;
    updatedAt: Date;
    lastExecutedAt?: Date;
    executionCount: number;
    statistics: {
        averageExecutionTime?: number;
        successRate?: number;
        lastExecutionStatus?: string;
    };
}
//# sourceMappingURL=workflow.entity.d.ts.map