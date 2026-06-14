export interface RetryStrategy {
    maxAttempts: number;
    backoffMs: number;
    exponential: boolean;
}
export interface WorkflowCheckpoint {
    id: string;
    workflowId: string;
    stepId: string;
    state: Record<string, unknown>;
    timestamp: Date;
}
export interface RecoveryResult {
    success: boolean;
    strategy: RecoveryStrategy;
    checkpoint?: WorkflowCheckpoint;
    error?: Error;
}
export interface WorkflowError {
    code: string;
    stepId?: string;
    recoverable: boolean;
}
export type RecoveryStrategy = 'retry' | 'rollback' | 'compensate' | 'skip';
export declare class ErrorRecoveryManager {
    private checkpoints;
    private retryStrategies;
    recover(workflowId: string, error: WorkflowError): Promise<RecoveryResult>;
    private determineRecoveryStrategy;
    private retryStep;
    private rollbackToCheckpoint;
    private compensateTransaction;
    private skipStep;
    createCheckpoint(workflowId: string, stepId: string, state: Record<string, unknown>): WorkflowCheckpoint;
    setRetryStrategy(workflowId: string, strategy: RetryStrategy): void;
    clearCheckpoints(workflowId: string): void;
}
//# sourceMappingURL=errorRecovery.d.ts.map