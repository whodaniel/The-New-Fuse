import React from 'react';
import { WorkflowStep, WorkflowMetrics, WorkflowStatus } from '../types.js';

interface WorkflowControlPanelProps {
    workflow: {
        id: string;
        steps: WorkflowStep[];
        status: WorkflowStatus;
    };
    metrics?: WorkflowMetrics;
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onReset: () => void;
}

export declare const WorkflowControlPanel: React.FC<WorkflowControlPanelProps>;
export {};
