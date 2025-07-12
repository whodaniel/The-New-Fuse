export class CircuitBreaker {
    state = 'CLOSED';
    failureCount = 0;
    lastFailureTime = 0;
    halfOpenRequests = 0;
    config;
    constructor(config = {}) {
        this.config = {
            failureThreshold: config.failureThreshold || 5,
            resetTimeout: config.resetTimeout || 60000, // 1 minute
            halfOpenRequests: config.halfOpenRequests || 3
        };
    }
    async execute(operation) {
        if (this.isOpen() && !this.shouldAttemptReset()) {
            throw new Error('Circuit breaker is OPEN');
        }
        if (this.isHalfOpen() && this.halfOpenRequests >= this.config.halfOpenRequests) {
            throw new Error('Circuit breaker is HALF_OPEN - too many requests');
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    shouldAttemptReset() {
        if (this.state === 'OPEN' && Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
            this.state = 'HALF_OPEN';
            this.halfOpenRequests = 0;
            return true;
        }
        return false;
    }
    onSuccess() {
        this.failureCount = 0;
        this.halfOpenRequests = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
        }
        else if (this.failureCount >= this.config.failureThreshold) {
            this.state = 'OPEN';
        }
    }
    isOpen() {
        return this.state === 'OPEN';
    }
    isClosed() {
        return this.state === 'CLOSED';
    }
    isHalfOpen() {
        return this.state === 'HALF_OPEN';
    }
    getState() {
        return this.state;
    }
    getFailureCount() {
        return this.failureCount;
    }
    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.halfOpenRequests = 0;
        this.lastFailureTime = 0;
    }
}
