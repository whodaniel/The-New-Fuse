export declare class WorkflowErrorRecovery {
    private readonly retryStrategies;
    private readonly checkpoints;
    handleStepFailure(): Promise<void>;
}
