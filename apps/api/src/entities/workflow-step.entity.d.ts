import { Workflow } from './workflow.entity.tsx';
import { Agent } from './agent.entity.tsx';
export declare class WorkflowStep {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    workflow: Workflow;
    agent?: Agent;
    nextSteps: string[];
    conditions: Record<string, any>;
    transformations: Record<string, any>;
    metadata: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastExecutedAt?: Date;
    statistics: {
        averageExecutionTime?: number;
        successRate?: number;
        lastExecutionStatus?: string;
        errorCount?: number;
    };
}
