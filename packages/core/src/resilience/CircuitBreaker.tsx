interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenRequests: number;
}

export class CircuitBreaker {
    private state: 'CLOSED' | 'OPEN' | 'HALF-OPEN' = 'CLOSED';
    private failures = 0;
    private lastFailureTime?: Date;

    constructor(private config: CircuitBreakerConfig) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.isOpen()) {
            throw new Error('Circuit breaker is OPEN');
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private isOpen(): boolean {
        if (this.state === 'OPEN') {
            if (this.shouldAttemptReset()) {
                this.state = 'HALF-OPEN';
                return false;
            }
            return true;
        }
        return false;
    }

    private onSuccess(): void {
        if (this.state === 'HALF-OPEN') {
            this.state = 'CLOSED';
            this.failures = 0;
        }
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = new Date();
        if (this.failures >= this.config.failureThreshold) {
            this.state = 'OPEN';
        }
    }

    private shouldAttemptReset(): boolean {
        if (!this.lastFailureTime) return true;
        const elapsed = Date.now() - this.lastFailureTime.getTime();
        return elapsed >= this.config.resetTimeout;
    }
}