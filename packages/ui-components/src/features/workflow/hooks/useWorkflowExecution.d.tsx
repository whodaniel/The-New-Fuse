interface WorkflowExecutionOptions {
    onStepComplete?: (stepId: string) => void;
    onWorkflowComplete?: () => void;
    onError?: (error: Error) => void;
}
export declare function useWorkflowExecution({ onStepComplete, onWorkflowComplete, onError }: WorkflowExecutionOptions): {
    executeStep: () => Promise<void>;
    pauseWorkflow: () => Promise<void>;
    resumeWorkflow: () => Promise<void>;
};
export {};
