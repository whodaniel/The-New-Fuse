export declare class WorkflowConcurrencyManager {
    private readonly lockManager;
    private readonly executionQueue;
    executeWorkflow(): Promise<void>;
}
