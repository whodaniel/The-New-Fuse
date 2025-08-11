export interface RetryStrategy {
  // Implementation needed
}
  maxAttempts: number;
  backoffMs: number;
  exponential: boolean;
}

export interface WorkflowCheckpoint {
  // Implementation needed
}
  id: string;
  workflowId: string;
  stepId: string;
  state: Record<string, unknown>;
  timestamp: Date;
}

export interface RecoveryResult {
  // Implementation needed
}
  success: boolean;
  strategy: RecoveryStrategy;
  checkpoint?: WorkflowCheckpoint;
  error?: Error;
}

export interface WorkflowError extends Error {
  // Implementation needed
}
  code: string;
  stepId?: string;
  recoverable: boolean;
}

export type RecoveryStrategy = 'retry' | 'rollback' | 'compensate' | 'skip';
export class ErrorRecoveryManager {
  // Implementation needed
}
  private checkpoints = new Map<string, WorkflowCheckpoint[]>();
  private retryStrategies = new Map<string, RetryStrategy>();
  async recover(workflowId: string, error: WorkflowError): Promise<RecoveryResult> {
  // Implementation needed
}
    const strategy = this.determineRecoveryStrategy(error);
    switch (strategy) {
  // Implementation needed
}
      case 'retry':
        return this.retryStep(workflowId, error);
      case 'rollback':
        return this.rollbackToCheckpoint(workflowId, error);
      case 'compensate':
        return this.compensateTransaction(workflowId, error);
      case 'skip':
        return this.skipStep(workflowId, error);
      default:
        return { success: false, strategy, error };
    }
  }
  
  private determineRecoveryStrategy(error: WorkflowError): RecoveryStrategy {
  // Implementation needed
}
    if (error.code === 'TRANSIENT_ERROR') {
  // Implementation needed
}
      return 'retry';
    } else if (error.code === 'DATA_CORRUPTION') {
  // Implementation needed
}
      return 'rollback';
    } else if (error.code === 'BUSINESS_RULE_VIOLATION') {
  // Implementation needed
}
      return 'compensate';
    } else if (error.code === 'NON_CRITICAL_ERROR') {
  // Implementation needed
}
      return 'skip';
    }
    
    return 'rollback'; // Default strategy
  }
  
  private async retryStep(workflowId: string, error: WorkflowError): Promise<RecoveryResult> {
  // Implementation needed
}
    const strategy = this.retryStrategies.get(workflowId) || {
  // Implementation needed
}
      maxAttempts: 3,
      backoffMs: 1000,
      exponential: true
    };
    // Implementation would retry the failed step
    return { success: true, strategy: 'retry' };
  }
  
  private async rollbackToCheckpoint(workflowId: string, error: WorkflowError): Promise<RecoveryResult> {
  // Implementation needed
}
    const checkpoints = this.checkpoints.get(workflowId) || [];
    const lastCheckpoint = checkpoints[checkpoints.length - 1];
    if (!lastCheckpoint) {
  // Implementation needed
}
      return { success: false, strategy: 'rollback', error: new Error('No checkpoint available') };
    }
    
    // Implementation would restore state to checkpoint
    return { success: true, strategy: 'rollback', checkpoint: lastCheckpoint };
  }
  
  private async compensateTransaction(workflowId: string, error: WorkflowError): Promise<RecoveryResult> {
  // Implementation needed
}
    // Implementation would run compensating actions
    return { success: true, strategy: 'compensate' };
  }
  
  private async skipStep(workflowId: string, error: WorkflowError): Promise<RecoveryResult> {
  // Implementation needed
}
    // Implementation would skip the failed step and continue
    return { success: true, strategy: 'skip' };
  }
  
  createCheckpoint(workflowId: string, stepId: string, state: Record<string, unknown>): WorkflowCheckpoint {
  // Implementation needed
}
    const checkpoint: WorkflowCheckpoint = {
  // Implementation needed
}
      id: `${workflowId}_${stepId}_${Date.now()}`,
      workflowId,
      stepId,
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      timestamp: new Date()
    };
    if (!this.checkpoints.has(workflowId)) {
  // Implementation needed
}
      this.checkpoints.set(workflowId, []);
    }
    
    this.checkpoints.get(workflowId)!.push(checkpoint);
    return checkpoint;
  }
  
  setRetryStrategy(workflowId: string, strategy: RetryStrategy): void {
  // Implementation needed
}
    this.retryStrategies.set(workflowId, strategy);
  }
  
  clearCheckpoints(workflowId: string): void {
  // Implementation needed
}
    this.checkpoints.delete(workflowId);
  }
}