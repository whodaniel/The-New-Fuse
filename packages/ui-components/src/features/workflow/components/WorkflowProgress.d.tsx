import { FC } from "react";
import { WorkflowStep, WorkflowStatus } from '../types.js';
interface WorkflowProgressProps {
    steps: WorkflowStep[];
    currentStep?: string;
    completedSteps: string[];
    className?: string;
}
export declare const WorkflowProgress: FC<WorkflowProgressProps>;
export {};
