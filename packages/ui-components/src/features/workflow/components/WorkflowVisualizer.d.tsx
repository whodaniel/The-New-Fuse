import { FC } from "react";
import { WorkflowStep } from '@the-new-fuse/types';
// import { WorkflowMetrics } from '../types.js'; // Removed as type is not defined

interface WorkflowVisualizerProps {
    steps: WorkflowStep[];
    // metrics?: WorkflowMetrics; // Removed as type is not defined
    onStepClick?: (step: WorkflowStep) => void;
    highlightedStepId?: string;
}

export declare const WorkflowVisualizer: FC<WorkflowVisualizerProps>;
export {};
