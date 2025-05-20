import { Injectable } from '@nestjs/common';
import { BaseError, ErrorCategory } from '../types.js';
import { DatabaseService } from '../../database/database.service.js';
import { NetworkService } from '../../network/network.service.js';
import { CacheService } from '../../cache/cache.service.js';

@Injectable()
export class RecoveryStrategies {
  constructor(
    private readonly db: DatabaseService,
    private readonly network: NetworkService,
    private readonly cache: CacheService,
  ) {}

  async handleDatabaseError(error: BaseError): Promise<void> {
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
        throw new Error(`No recovery strategy for database error: ${error.code}`);
    }
  }

  async handleNetworkError(error: BaseError): Promise<void> {
    switch (error.code) {
      case 'REQUEST_TIMEOUT':
        await this.network.resetConnection();
        await this.network.applyBackoff();
        break;
      case 'SERVICE_UNAVAILABLE':
        await this.network.switchToFallbackService();
        break;
      default:
        throw new Error(`No recovery strategy for network error: ${error.code}`);
    }
  }

  async handleCacheError(error: BaseError): Promise<void> {
    switch (error.code) {
      case 'CACHE_MISS':
        await this.cache.rebuild();
        break;
      case 'CACHE_CORRUPT':
        await this.cache.clear();
        await this.cache.warmup();
        break;
      default:
        throw new Error(`No recovery strategy for cache error: ${error.code}`);
    }
  }
}