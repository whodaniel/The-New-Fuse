export declare class WorkflowStatePersistence {
    private readonly stateManager;
    private readonly eventStore;
    persistWorkflowState(): Promise<void>;
}
