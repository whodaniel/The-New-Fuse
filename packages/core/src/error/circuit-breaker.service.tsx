import { Injectable, Logger } from '@nestjs/common';

interface CircuitState {
  isOpen: boolean;
  failureCount: number;
  lastFailure: Date;
  nextRetry: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitState>();

  private readonly config = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    halfOpenTimeout: 5000 // 5 seconds
  };

  async executeWithCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getCircuit(key);

    if (this.isCircuitOpen(circuit)) {
      throw new Error(`Circuit breaker is open for ${key}`);
    }

    try {
      const result = await operation();
      this.resetCircuit(key);
      return result;
    } catch (error) {
      this.recordFailure(key);
      throw error;
    }
  }

  private getCircuit(key: string): CircuitState {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        isOpen: false,
        failureCount: 0,
        lastFailure: new Date(0),
        nextRetry: new Date(0)
      });
    }
    return this.circuits.get(key)!;
  }

  private isCircuitOpen(circuit: CircuitState): boolean {
    if (!circuit.isOpen) return false;

    if (Date.now() > circuit.nextRetry.getTime()) {
      circuit.isOpen = false;
      circuit.failureCount = 0;
      return false;
    }

    return true;
  }

  private recordFailure(key: string): void {
    const circuit = this.getCircuit(key);
    circuit.failureCount++;
    circuit.lastFailure = new Date();

    if (circuit.failureCount >= this.config.failureThreshold) {
      circuit.isOpen = true;
      circuit.nextRetry = new Date(Date.now() + this.config.resetTimeout);
      this.logger.warn(`Circuit breaker opened for ${key}`);
    }
  }

  private resetCircuit(key: string): void {
    const circuit = this.getCircuit(key);
    circuit.isOpen = false;
    circuit.failureCount = 0;
    circuit.lastFailure = new Date(0);
    circuit.nextRetry = new Date(0);
  }
}