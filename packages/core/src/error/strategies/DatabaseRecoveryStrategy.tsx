import { Injectable } from '@nestjs/common';
import { BaseError, ErrorCategory } from '../types.js';
import { DatabaseService } from '../../database/database.service.js';
import { BaseRecoveryStrategy } from './BaseRecoveryStrategy.js';

@Injectable()
export class DatabaseRecoveryStrategy extends BaseRecoveryStrategy {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  canHandle(error: BaseError): boolean {
    return error.category === ErrorCategory.DATABASE;
  }

  async recover(error: BaseError): Promise<void> {
    return this.withRetry(async () => {
      switch (error.code) {
        case 'CONNECTION_LOST':
          await this.db.reconnect();
          break;
        case 'TRANSACTION_ERROR':
          await this.db.rollbackTransaction();
          await this.db.retryTransaction();
          break;
        case 'TIMEOUT':
          await this.db.clearConnections();
          await this.db.initialize();
          break;
        default:
          throw new Error(`Unsupported database error code: ${error.code}`);
      }
    });
  }
}