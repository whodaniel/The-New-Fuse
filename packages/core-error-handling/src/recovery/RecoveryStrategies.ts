/**
 * Error Recovery Strategies
 *
 * @description
 * Implements various error recovery strategies for automatic error handling
 * and system resilience.
 */

import { ErrorCodes } from '../errors/CustomErrors.js';
import { BaseError, ErrorContext, RecoveryStrategy } from '../interfaces/IErrorHandling.js';
import { Logger } from '../utils/Logger.js';

/**
 * Network reconnection strategy
 */
export class NetworkReconnectionStrategy implements RecoveryStrategy {
  name = 'NetworkReconnection';
  applicableErrorCodes = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.CONNECTION_ERROR,
    ErrorCodes.TIMEOUT,
  ];
  maxAttempts = 3;
  delay = 2000;

  private logger = new Logger('NetworkReconnectionStrategy');

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    this.logger.info('Attempting network reconnection', { error: error.code });

    // Check if network is available
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.logger.warn('Network is offline, waiting for connection');
      await this.waitForOnline();
    }

    // Perform a test request to verify connectivity
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        this.logger.info('Network connection restored');
        return true;
      }
    } catch (error) {
      this.logger.error('Network test failed', error);
    }

    return false;
  }

  private waitForOnline(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const onlineHandler = () => {
        window.removeEventListener('online', onlineHandler);
        resolve();
      };

      window.addEventListener('online', onlineHandler);

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('online', onlineHandler);
        resolve();
      }, 30000);
    });
  }
}

/**
 * Token refresh strategy for expired authentication tokens
 */
export class TokenRefreshStrategy implements RecoveryStrategy {
  name = 'TokenRefresh';
  applicableErrorCodes = [ErrorCodes.TOKEN_EXPIRED, ErrorCodes.AUTH_ERROR];
  maxAttempts = 1;
  delay = 0;

  private logger = new Logger('TokenRefreshStrategy');
  private refreshCallback?: () => Promise<boolean>;

  constructor(refreshCallback?: () => Promise<boolean>) {
    this.refreshCallback = refreshCallback;
  }

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    if (!this.refreshCallback) {
      this.logger.warn('No refresh callback configured');
      return false;
    }

    try {
      this.logger.info('Attempting to refresh authentication token');
      const success = await this.refreshCallback();

      if (success) {
        this.logger.info('Token refresh successful');
        return true;
      }

      this.logger.warn('Token refresh failed');
      return false;
    } catch (error) {
      this.logger.error('Token refresh error', error);
      return false;
    }
  }

  setRefreshCallback(callback: () => Promise<boolean>): void {
    this.refreshCallback = callback;
  }
}

/**
 * Cache fallback strategy - use cached data when fresh data is unavailable
 */
export class CacheFallbackStrategy implements RecoveryStrategy {
  name = 'CacheFallback';
  applicableErrorCodes = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT,
    ErrorCodes.SERVICE_UNAVAILABLE,
  ];
  maxAttempts = 1;
  delay = 0;

  private logger = new Logger('CacheFallbackStrategy');
  private cacheProvider?: (key: string) => Promise<any>;

  constructor(cacheProvider?: (key: string) => Promise<any>) {
    this.cacheProvider = cacheProvider;
  }

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    if (!this.cacheProvider) {
      this.logger.warn('No cache provider configured');
      return false;
    }

    const cacheKey = context.metadata?.cacheKey || context.operation;
    if (!cacheKey) {
      this.logger.warn('No cache key available');
      return false;
    }

    try {
      this.logger.info('Attempting to use cached data', { cacheKey });
      const cachedData = await this.cacheProvider(cacheKey);

      if (cachedData !== null && cachedData !== undefined) {
        this.logger.info('Using cached data');
        // Store cached data in context for retrieval
        if (context.metadata) {
          context.metadata.cachedData = cachedData;
          context.metadata.usingCache = true;
        }
        return true;
      }

      this.logger.warn('No cached data available');
      return false;
    } catch (error) {
      this.logger.error('Cache retrieval error', error);
      return false;
    }
  }

  setCacheProvider(provider: (key: string) => Promise<any>): void {
    this.cacheProvider = provider;
  }
}

/**
 * Service failover strategy - switch to backup service
 */
export class ServiceFailoverStrategy implements RecoveryStrategy {
  name = 'ServiceFailover';
  applicableErrorCodes = [ErrorCodes.SERVICE_UNAVAILABLE, ErrorCodes.EXTERNAL_SERVICE_ERROR];
  maxAttempts = 2;
  delay = 1000;

  private logger = new Logger('ServiceFailoverStrategy');
  private backupServices: Map<string, string[]> = new Map();
  private currentServiceIndex: Map<string, number> = new Map();

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    const serviceName = context.metadata?.serviceName || context.serviceId;
    if (!serviceName) {
      this.logger.warn('No service name available for failover');
      return false;
    }

    const backups = this.backupServices.get(serviceName);
    if (!backups || backups.length === 0) {
      this.logger.warn('No backup services configured', { serviceName });
      return false;
    }

    const currentIndex = this.currentServiceIndex.get(serviceName) || 0;
    const nextIndex = (currentIndex + 1) % backups.length;

    this.logger.info('Failing over to backup service', {
      serviceName,
      backup: backups[nextIndex],
    });

    this.currentServiceIndex.set(serviceName, nextIndex);

    // Store the backup service URL in context for use
    if (context.metadata) {
      context.metadata.serviceUrl = backups[nextIndex];
      context.metadata.isFailover = true;
    }

    return true;
  }

  registerBackupService(primaryService: string, backupUrls: string[]): void {
    this.backupServices.set(primaryService, backupUrls);
  }
}

/**
 * Data sanitization strategy - clean and retry with sanitized data
 */
export class DataSanitizationStrategy implements RecoveryStrategy {
  name = 'DataSanitization';
  applicableErrorCodes = [ErrorCodes.VALIDATION_ERROR, ErrorCodes.INVALID_FORMAT];
  maxAttempts = 1;
  delay = 0;

  private logger = new Logger('DataSanitizationStrategy');
  private sanitizers: Map<string, (data: any) => any> = new Map();

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    const dataType = context.metadata?.dataType || 'default';
    const sanitizer = this.sanitizers.get(dataType);

    if (!sanitizer) {
      this.logger.warn('No sanitizer configured for data type', { dataType });
      return false;
    }

    try {
      const originalData = context.metadata?.data;
      if (!originalData) {
        this.logger.warn('No data available for sanitization');
        return false;
      }

      this.logger.info('Attempting to sanitize data', { dataType });
      const sanitizedData = sanitizer(originalData);

      if (context.metadata) {
        context.metadata.data = sanitizedData;
        context.metadata.wasSanitized = true;
      }

      this.logger.info('Data sanitization successful');
      return true;
    } catch (error) {
      this.logger.error('Data sanitization failed', error);
      return false;
    }
  }

  registerSanitizer(dataType: string, sanitizer: (data: any) => any): void {
    this.sanitizers.set(dataType, sanitizer);
  }
}

/**
 * Graceful degradation strategy - continue with reduced functionality
 */
export class GracefulDegradationStrategy implements RecoveryStrategy {
  name = 'GracefulDegradation';
  applicableErrorCodes = [
    ErrorCodes.SERVICE_UNAVAILABLE,
    ErrorCodes.EXTERNAL_SERVICE_ERROR,
    ErrorCodes.SYSTEM_ERROR,
  ];
  maxAttempts = 1;
  delay = 0;

  private logger = new Logger('GracefulDegradationStrategy');
  private fallbackHandlers: Map<string, () => Promise<any>> = new Map();

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    const operation = context.operation;
    const fallbackHandler = this.fallbackHandlers.get(operation);

    if (!fallbackHandler) {
      this.logger.warn('No fallback handler for operation', { operation });
      return false;
    }

    try {
      this.logger.info('Attempting graceful degradation', { operation });
      const fallbackResult = await fallbackHandler();

      if (context.metadata) {
        context.metadata.fallbackData = fallbackResult;
        context.metadata.isDegraded = true;
      }

      this.logger.info('Graceful degradation successful');
      return true;
    } catch (error) {
      this.logger.error('Graceful degradation failed', error);
      return false;
    }
  }

  registerFallbackHandler(operation: string, handler: () => Promise<any>): void {
    this.fallbackHandlers.set(operation, handler);
  }
}

/**
 * Rate limit backoff strategy
 */
export class RateLimitBackoffStrategy implements RecoveryStrategy {
  name = 'RateLimitBackoff';
  applicableErrorCodes = [ErrorCodes.RATE_LIMIT];
  maxAttempts = 3;
  delay = 5000;

  private logger = new Logger('RateLimitBackoffStrategy');

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    const retryAfter = context.metadata?.retryAfter;
    const waitTime = retryAfter ? retryAfter * 1000 : this.delay;

    this.logger.info('Rate limited, waiting before retry', { waitTime });

    await new Promise((resolve) => setTimeout(resolve, waitTime));

    return true;
  }
}

/**
 * Database transaction rollback strategy
 */
export class DatabaseRollbackStrategy implements RecoveryStrategy {
  name = 'DatabaseRollback';
  applicableErrorCodes = [ErrorCodes.DATABASE_ERROR];
  maxAttempts = 1;
  delay = 0;

  private logger = new Logger('DatabaseRollbackStrategy');
  private rollbackCallback?: (transactionId: string) => Promise<boolean>;

  constructor(rollbackCallback?: (transactionId: string) => Promise<boolean>) {
    this.rollbackCallback = rollbackCallback;
  }

  async recover(error: BaseError, context: ErrorContext): Promise<boolean> {
    if (!this.rollbackCallback) {
      this.logger.warn('No rollback callback configured');
      return false;
    }

    const transactionId = context.metadata?.transactionId;
    if (!transactionId) {
      this.logger.warn('No transaction ID available for rollback');
      return false;
    }

    try {
      this.logger.info('Attempting database rollback', { transactionId });
      const success = await this.rollbackCallback(transactionId);

      if (success) {
        this.logger.info('Database rollback successful');
        return true;
      }

      this.logger.warn('Database rollback failed');
      return false;
    } catch (error) {
      this.logger.error('Database rollback error', error);
      return false;
    }
  }

  setRollbackCallback(callback: (transactionId: string) => Promise<boolean>): void {
    this.rollbackCallback = callback;
  }
}

/**
 * Export all recovery strategies
 */
export const defaultRecoveryStrategies = {
  networkReconnection: new NetworkReconnectionStrategy(),
  tokenRefresh: new TokenRefreshStrategy(),
  cacheFallback: new CacheFallbackStrategy(),
  serviceFailover: new ServiceFailoverStrategy(),
  dataSanitization: new DataSanitizationStrategy(),
  gracefulDegradation: new GracefulDegradationStrategy(),
  rateLimitBackoff: new RateLimitBackoffStrategy(),
  databaseRollback: new DatabaseRollbackStrategy(),
};
