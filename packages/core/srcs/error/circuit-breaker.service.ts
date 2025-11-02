import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker, CircuitBreakerState } from 'ts-circuit-breaker';

@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger(CircuitBreakerService.name);
    private readonly breakers = new Map<string, CircuitBreaker>();

    constructor() {}

    getBreaker(name: string): CircuitBreaker {
        if (!this.breakers.has(name)) {
            const breaker = new CircuitBreaker();
            this.breakers.set(name, breaker);
            this.logger.log(`Created new circuit breaker: ${name}`);
            breaker.on('state-changed', (state: CircuitBreakerState) => {
                this.logger.log(`Circuit breaker ${name} state changed to ${state}`);
            });
        }
        return this.breakers.get(name);
    }

    async execute<T>(name: string, command: () => Promise<T>): Promise<T> {
        const breaker = this.getBreaker(name);
        return breaker.execute(command);
    }
}
