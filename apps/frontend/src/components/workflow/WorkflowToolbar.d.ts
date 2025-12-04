import React from 'react';
interface WorkflowToolbarProps {
    workflowName: string;
    onNameChange: (name: string) => void;
    onSave: () => void;
    onExecute: () => void;
    isSaving: boolean;
    isExecuting: boolean;
}
export declare const WorkflowToolbar: React.FC<WorkflowToolbarProps>;
export {};
