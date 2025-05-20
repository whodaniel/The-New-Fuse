import { ServiceStatusType } from './services/service-types.js';
import { ErrorCode } from './errors.js';
export interface CreateWorkflowDto {
    name: string;
    description?: string;
    steps: WorkflowStep[];
    config?: Record<string, unknown>;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    next?: string[];
}
export interface WorkflowInput {
    data: Record<string, unknown>;
    context?: Record<string, unknown>;
}
export interface WorkflowExecutionStatus {
    id: string;
    workflowId: string;
    status: ServiceStatusType;
    currentStep?: string;
    output?: Record<string, unknown>;
    error?: {
        code: ErrorCode;
        message: string;
        details?: Record<string, unknown>;
    };
    startTime: Date;
    endTime?: Date;
    progress?: number;
}
//# sourceMappingURL=workflow.types.d.d.ts.map