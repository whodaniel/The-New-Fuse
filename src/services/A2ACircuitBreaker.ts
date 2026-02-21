import { Injectable } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';

enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN
}

@Injectable()
export class A2ACircuitBreaker {
    private state = CircuitState.CLOSED;
    private failureCount = 0;
    private lastFailureTime: number = 0;
    private readonly failureThreshold = 5;
    private readonly resetTimeout = 30000; // 30 seconds

    constructor(private logger: A2ALogger) {}

    async execute<T>(
        operation: () => Promise<T>,
        fallback: () => Promise<T>
    ): Promise<T> {
        if (this.isOpen()) {
            return fallback();
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            this.logger.logError(error, { circuit: this.state });
            return fallback();
        }
    }

    private isOpen(): boolean {
        if (this.state === CircuitState.OPEN) {
            const timeElapsed = Date.now() - this.lastFailureTime;
            if (timeElapsed >= this.resetTimeout) {
                this.state = CircuitState.HALF_OPEN;
                return false;
            }
            return true;
        }
        return false;
    }

    private onSuccess(): void {
        this.failureCount = 0;
        this.state = CircuitState.CLOSED;
    }

    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }
}