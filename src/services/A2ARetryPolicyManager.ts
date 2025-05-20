import { Injectable } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';
import { ConfigService } from '@nestjs/config';

interface RetryPolicy {
    maxAttempts: number;
    backoffType: 'exponential' | 'linear' | 'fixed';
    initialDelay: number;
    maxDelay: number;
}

@Injectable()
export class A2ARetryPolicyManager {
    private readonly defaultPolicy: RetryPolicy = {
        maxAttempts: 3,
        backoffType: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000
    };

    constructor(
        private logger: A2ALogger,
        private config: ConfigService
    ) {}

    async executeWithRetry<T>(
        operation: () => Promise<T>,
        policy?: Partial<RetryPolicy>
    ): Promise<T> {
        const retryPolicy = { ...this.defaultPolicy, ...policy };
        let attempt = 0;
        let lastError: Error;

        while (attempt < retryPolicy.maxAttempts) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                attempt++;

                if (attempt < retryPolicy.maxAttempts) {
                    const delay = this.calculateDelay(attempt, retryPolicy);
                    this.logger.logProtocolMessage({
                        type: 'RETRY_ATTEMPT',
                        attempt,
                        delay,
                        error: error.message
                    }, { retry: true });

                    await this.delay(delay);
                }
            }
        }

        throw new Error(`Operation failed after ${attempt} attempts: ${lastError.message}`);
    }

    private calculateDelay(attempt: number, policy: RetryPolicy): number {
        switch (policy.backoffType) {
            case 'exponential':
                return Math.min(
                    policy.initialDelay * Math.pow(2, attempt - 1),
                    policy.maxDelay
                );
            case 'linear':
                return Math.min(
                    policy.initialDelay * attempt,
                    policy.maxDelay
                );
            case 'fixed':
                return policy.initialDelay;
            default:
                return policy.initialDelay;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getDefaultPolicy(): RetryPolicy {
        return { ...this.defaultPolicy };
    }

    createCustomPolicy(options: Partial<RetryPolicy>): RetryPolicy {
        return { ...this.defaultPolicy, ...options };
    }
}