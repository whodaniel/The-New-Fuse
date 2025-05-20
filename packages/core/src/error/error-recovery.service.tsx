import { Injectable, Logger } from '@nestjs/common';
import { BaseError, ErrorCategory, DatabaseError, NetworkError } from './types.js';
import { RetryStrategy } from '../utils/retry.js';

@Injectable()
export class ErrorRecoveryService {
  private readonly logger = new Logger(ErrorRecoveryService.name);
  private readonly retryStrategy = new RetryStrategy();

  async recover(error: BaseError): Promise<boolean> {
    const strategy = this.getRecoveryStrategy(error);

    if (!strategy) {
      this.logger.warn(`No recovery strategy found for error: ${error.code}`);
      return false;
    }

    try {
      await strategy.execute(error);
      return true;
    } catch (recoveryError) {
      this.logger.error('Recovery failed', {
        originalError: error,
        recoveryError
      });
      return false;
    }
  }

  private getRecoveryStrategy(error: BaseError): { execute: (error: BaseError) => Promise<void>; retries: number } | null {
    switch (error.category) {
      case ErrorCategory.DATABASE:
        return {
          execute: this.handleDatabaseError.bind(this),
          retries: 3
        };
      case ErrorCategory.NETWORK:
        return {
          execute: this.handleNetworkError.bind(this),
          retries: 5
        };
      // Add other strategies as needed
      default:
        return null;
    }
  }

  private async handleDatabaseError(error: DatabaseError): Promise<void> {
    switch (error.code) {
      case 'CONNECTION_LOST':
        await this.retryStrategy.execute(async () => {
          await this.db.reconnect();
        }, 3);
        break;

      case 'TRANSACTION_FAILED':
        await this.db.rollbackTransaction();
        await this.retryStrategy.execute(() => this.db.retryTransaction(), 2);
        break;

      case 'TIMEOUT':
        await this.db.clearConnections();
        await this.db.initialize();
        break;

      default:
        throw new Error(`Unhandled database error: ${error.code}`);
    }
  }

  private async handleNetworkError(error: NetworkError): Promise<void> {
    switch (error.code) {
      case 'REQUEST_TIMEOUT':
        await this.retryStrategy.execute(async () => {
          await this.network.resetConnection();
          const backoffTime = Math.min(1000 * Math.pow(2, error.attempts || 0), 32000);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }, 3);
        break;

      case 'SERVICE_UNAVAILABLE':
        await this.network.switchToFallbackService();
        break;

      default:
        throw new Error(`Unhandled network error: ${error.code}`);
    }
  }
}
