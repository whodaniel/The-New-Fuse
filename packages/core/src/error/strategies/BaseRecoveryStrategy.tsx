import { Injectable, Logger } from '@nestjs/common';
import { BaseError } from '../types.js';
import { IRecoveryStrategy } from './IRecoveryStrategy.js';

@Injectable()
export abstract class BaseRecoveryStrategy implements IRecoveryStrategy {
  protected readonly logger = new Logger(this.constructor.name);

  abstract canHandle(error: BaseError): boolean;
  abstract recover(error: BaseError): Promise<void>;

  protected async withRetry(operation: () => Promise<void>): Promise<void> {
    let attempts = 0;
    let lastError: Error;
    const maxAttempts = this.getMaxAttempts();
    const backoffMs = this.getBackoffMs();

    while (attempts < maxAttempts) {
      try {
        await operation();
        return;
      } catch (error: unknown) {
        lastError = error as Error;
        attempts++;
        if (attempts === maxAttempts) break;
        await this.delay(backoffMs * attempts);
      }
    }

    throw new Error(`Recovery failed after ${attempts} attempts: ${lastError.message}`);
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected getMaxAttempts(): number {
    return 3; // Default value, can be overridden by subclasses
  }

  protected getBackoffMs(): number {
    return 1000; // Default value, can be overridden by subclasses
  }
}