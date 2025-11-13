/**
 * DTO classes for API responses
 * Simplified versions without Swagger decorators for build compatibility
 */
import { WorkflowStatus } from '@the-new-fuse/types';
/**
 * DTO class for Workflow (WorkflowDefinition)
 */
export declare class WorkflowDto {
    id: string;
    name: string;
    description?: string;
    version: string;
    triggerType: 'manual' | 'event' | 'schedule';
    triggerConfig?: Record<string, any>;
    steps: any[];
    initialContext?: Record<string, any>;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
/**
 * DTO class for WorkflowExecution (WorkflowInstance)
 */
export declare class WorkflowExecutionDto {
    id: string;
    definitionId: string;
    definitionVersion: string;
    status: WorkflowStatus;
    currentStepId?: string | null;
    context: Record<string, any>;
    startedAt?: Date | null;
    completedAt?: Date | null;
    error?: string | null;
    stepHistory?: Array<{
        stepId: string;
        status: WorkflowStatus;
        timestamp: Date;
        result?: unknown;
    }>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
/**
 * DTO class for Agent
 */
export declare class AgentDto {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    metadata?: Record<string, any>;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
//# sourceMappingURL=swagger-dto.d.ts.map