import { FC } from "react";
import { WorkflowStatus } from '../types.js';
interface WorkflowControlsProps {
    status: WorkflowStatus;
    onPause: () => void;
    onResume: () => void;
}
export declare const WorkflowControls: FC<WorkflowControlsProps>;
export {};
