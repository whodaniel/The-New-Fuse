import { WorkflowState } from '../types.js';
export declare function useWorkflowState(workflowId: string): {
    state: WorkflowState;
    updateState: (updates: Partial<WorkflowState>) => void;
};
