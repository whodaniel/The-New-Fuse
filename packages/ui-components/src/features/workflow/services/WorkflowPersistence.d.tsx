export declare class WorkflowPersistence {
    private storage;
    private readonly WORKFLOW_KEY_PREFIX;
    constructor(storage?: Storage);
    saveWorkflowState(): Promise<void>;
}
