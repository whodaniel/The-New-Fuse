import { FC } from "react";
import { WorkflowStatus, WorkflowStep } from './types.js';

export interface WorkflowEngineProps {
    workflowId: string;
    steps: WorkflowStep[];
    onStepComplete?: (stepId: string) => void;
    onWorkflowComplete?: () => void;
    onError?: (error: Error) => void;
    className?: string;
}

// Export the WorkflowEngine component declaration
export declare const WorkflowEngine: FC<WorkflowEngineProps>;
