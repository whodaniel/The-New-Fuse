import { FC } from "react";
import { WorkflowStep } from '../types.js';
interface WorkflowStepViewerProps {
    step?: WorkflowStep;
    onExecute: (stepId: string) => void;
    isExecuting?: boolean;
}
export declare const WorkflowStepViewer: FC<WorkflowStepViewerProps>;
export {};
