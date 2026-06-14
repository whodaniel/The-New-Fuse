export class ErrorRecoveryManager {
    constructor() {
        this.checkpoints = new Map();
        this.retryStrategies = new Map();
    }
    async recover(workflowId, error) {
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
    determineRecoveryStrategy(error) {
        if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
            return 'retry';
        }
        else if (error.code === 'VALIDATION_ERROR') {
            return 'compensate';
        }
        else if (error.code === 'NON_CRITICAL_ERROR') {
            return 'skip';
        }
        return 'rollback'; // Default strategy
    }
    async retryStep(workflowId, _error) {
        const strategy = this.retryStrategies.get(workflowId) || {
            maxAttempts: 3,
            backoffMs: 1000,
            exponential: true
        };
        // Implementation for retry logic would go here
        // Use strategy for retry configuration
        console.log(`Retrying with strategy:`, strategy);
        return { success: true, strategy: 'retry' };
    }
    async rollbackToCheckpoint(workflowId, _error) {
        const checkpoints = this.checkpoints.get(workflowId) || [];
        const lastCheckpoint = checkpoints[checkpoints.length - 1];
        if (!lastCheckpoint) {
            return { success: false, strategy: 'rollback', error: new Error('No checkpoint available') };
        }
        // Implementation for rollback logic would go here
        return { success: true, strategy: 'rollback', checkpoint: lastCheckpoint };
    }
    async compensateTransaction(_workflowId, _error) {
        // Implementation for compensation logic would go here
        return { success: true, strategy: 'compensate' };
    }
    async skipStep(_workflowId, _error) {
        // Implementation for skip logic would go here
        return { success: true, strategy: 'skip' };
    }
    createCheckpoint(workflowId, stepId, state) {
        const checkpoint = {
            id: `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflowId,
            stepId,
            state,
            timestamp: new Date(),
        };
        if (!this.checkpoints.has(workflowId)) {
            this.checkpoints.set(workflowId, []);
        }
        this.checkpoints.get(workflowId).push(checkpoint);
        return checkpoint;
    }
    setRetryStrategy(workflowId, strategy) {
        this.retryStrategies.set(workflowId, strategy);
    }
    clearCheckpoints(workflowId) {
        this.checkpoints.delete(workflowId);
    }
}
//# sourceMappingURL=errorRecovery.js.map