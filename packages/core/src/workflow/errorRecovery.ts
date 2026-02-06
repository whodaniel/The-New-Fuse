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

export class ErrorRecoveryManager {
  private checkpoints = new Map<string, WorkflowCheckpoint[]>();
  private retryStrategies = new Map<string, RetryStrategy>();

  async recover(workflowId: string, error: WorkflowError): Promise<RecoveryResult> {
    const strategy = this.determineRecoveryStrategy(error);

    switch (strategy) {
      case 'retry':
        return this.retryStep(workflowId, error);
      case 'rollback':
        return this.rollbackToCheckpoint(workflowId, error);
      case 'compensate':
        return this.compensateTransaction(workflowId, error);
      case 'skip':
        return this.skipStep(workflowId, error);
      default:
        return { success: false, strategy, error: new Error(error.code) };
    }
  }

  private determineRecoveryStrategy(error: WorkflowError): RecoveryStrategy {
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
      return 'retry';
    } else if (error.code === 'VALIDATION_ERROR') {
      return 'compensate';
    } else if (error.code === 'NON_CRITICAL_ERROR') {
      return 'skip';
    }

    return 'rollback'; // Default strategy
  }

  private async retryStep(workflowId: string, _error: WorkflowError): Promise<RecoveryResult> {
    const strategy = this.retryStrategies.get(workflowId) || {
      maxAttempts: 3,
      backoffMs: 1000,
      exponential: true,
    };

    // Implementation for retry logic would go here
    // Use strategy for retry configuration
    console.log(`Retrying with strategy:`, strategy);
    return { success: true, strategy: 'retry' };
  }

  private async rollbackToCheckpoint(
    workflowId: string,
    _error: WorkflowError,
  ): Promise<RecoveryResult> {
    const checkpoints = this.checkpoints.get(workflowId) || [];
    const lastCheckpoint = checkpoints[checkpoints.length - 1];

    if (!lastCheckpoint) {
      return { success: false, strategy: 'rollback', error: new Error('No checkpoint available') };
    }

    // Implementation for rollback logic would go here
    return { success: true, strategy: 'rollback', checkpoint: lastCheckpoint };
  }

  private async compensateTransaction(
    _workflowId: string,
    _error: WorkflowError,
  ): Promise<RecoveryResult> {
    // Implementation for compensation logic would go here
    return { success: true, strategy: 'compensate' };
  }

  private async skipStep(_workflowId: string, _error: WorkflowError): Promise<RecoveryResult> {
    // Implementation for skip logic would go here
    return { success: true, strategy: 'skip' };
  }

  createCheckpoint(
    workflowId: string,
    stepId: string,
    state: Record<string, unknown>,
  ): WorkflowCheckpoint {
    const checkpoint: WorkflowCheckpoint = {
      id: `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      stepId,
      state,
      timestamp: new Date(),
    };

    if (!this.checkpoints.has(workflowId)) {
      this.checkpoints.set(workflowId, []);
    }

    this.checkpoints.get(workflowId)!.push(checkpoint);
    return checkpoint;
  }

  setRetryStrategy(workflowId: string, strategy: RetryStrategy): void {
    this.retryStrategies.set(workflowId, strategy);
  }

  clearCheckpoints(workflowId: string): void {
    this.checkpoints.delete(workflowId);
  }
}
