'use strict';
/**
 * Error Recovery Strategies
 *
 * @description
 * Implements various error recovery strategies for automatic error handling
 * and system resilience.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.defaultRecoveryStrategies =
  exports.DatabaseRollbackStrategy =
  exports.RateLimitBackoffStrategy =
  exports.GracefulDegradationStrategy =
  exports.DataSanitizationStrategy =
  exports.ServiceFailoverStrategy =
  exports.CacheFallbackStrategy =
  exports.TokenRefreshStrategy =
  exports.NetworkReconnectionStrategy =
    void 0;
const CustomErrors_js_1 = require('../errors/CustomErrors.js');
const Logger_js_1 = require('../utils/Logger.js');
/**
 * Network reconnection strategy
 */
class NetworkReconnectionStrategy {
  name = 'NetworkReconnection';
  applicableErrorCodes = [
    CustomErrors_js_1.ErrorCodes.NETWORK_ERROR,
    CustomErrors_js_1.ErrorCodes.CONNECTION_ERROR,
    CustomErrors_js_1.ErrorCodes.TIMEOUT,
  ];
  maxAttempts = 3;
  delay = 2000;
  logger = new Logger_js_1.Logger('NetworkReconnectionStrategy');
  async recover(error, context) {
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
  waitForOnline() {
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
exports.NetworkReconnectionStrategy = NetworkReconnectionStrategy;
/**
 * Token refresh strategy for expired authentication tokens
 */
class TokenRefreshStrategy {
  name = 'TokenRefresh';
  applicableErrorCodes = [
    CustomErrors_js_1.ErrorCodes.TOKEN_EXPIRED,
    CustomErrors_js_1.ErrorCodes.AUTH_ERROR,
  ];
  maxAttempts = 1;
  delay = 0;
  logger = new Logger_js_1.Logger('TokenRefreshStrategy');
  refreshCallback;
  constructor(refreshCallback) {
    this.refreshCallback = refreshCallback;
  }
  async recover(error, context) {
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
  setRefreshCallback(callback) {
    this.refreshCallback = callback;
  }
}
exports.TokenRefreshStrategy = TokenRefreshStrategy;
/**
 * Cache fallback strategy - use cached data when fresh data is unavailable
 */
class CacheFallbackStrategy {
  name = 'CacheFallback';
  applicableErrorCodes = [
    CustomErrors_js_1.ErrorCodes.NETWORK_ERROR,
    CustomErrors_js_1.ErrorCodes.TIMEOUT,
    CustomErrors_js_1.ErrorCodes.SERVICE_UNAVAILABLE,
  ];
  maxAttempts = 1;
  delay = 0;
  logger = new Logger_js_1.Logger('CacheFallbackStrategy');
  cacheProvider;
  constructor(cacheProvider) {
    this.cacheProvider = cacheProvider;
  }
  async recover(error, context) {
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
  setCacheProvider(provider) {
    this.cacheProvider = provider;
  }
}
exports.CacheFallbackStrategy = CacheFallbackStrategy;
/**
 * Service failover strategy - switch to backup service
 */
class ServiceFailoverStrategy {
  name = 'ServiceFailover';
  applicableErrorCodes = [
    CustomErrors_js_1.ErrorCodes.SERVICE_UNAVAILABLE,
    CustomErrors_js_1.ErrorCodes.EXTERNAL_SERVICE_ERROR,
  ];
  maxAttempts = 2;
  delay = 1000;
  logger = new Logger_js_1.Logger('ServiceFailoverStrategy');
  backupServices = new Map();
  currentServiceIndex = new Map();
  async recover(error, context) {
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
  registerBackupService(primaryService, backupUrls) {
    this.backupServices.set(primaryService, backupUrls);
  }
}
exports.ServiceFailoverStrategy = ServiceFailoverStrategy;
/**
 * Data sanitization strategy - clean and retry with sanitized data
 */
class DataSanitizationStrategy {
  name = 'DataSanitization';
  applicableErrorCodes = [
    CustomErrors_js_1.ErrorCodes.VALIDATION_ERROR,
    CustomErrors_js_1.ErrorCodes.INVALID_FORMAT,
  ];
  maxAttempts = 1;
  delay = 0;
  logger = new Logger_js_1.Logger('DataSanitizationStrategy');
  sanitizers = new Map();
  async recover(error, context) {
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
  registerSanitizer(dataType, sanitizer) {
    this.sanitizers.set(dataType, sanitizer);
  }
}
exports.DataSanitizationStrategy = DataSanitizationStrategy;
/**
 * Graceful degradation strategy - continue with reduced functionality
 */
class GracefulDegradationStrategy {
  name = 'GracefulDegradation';
  applicableErrorCodes = [
    CustomErrors_js_1.ErrorCodes.SERVICE_UNAVAILABLE,
    CustomErrors_js_1.ErrorCodes.EXTERNAL_SERVICE_ERROR,
    CustomErrors_js_1.ErrorCodes.SYSTEM_ERROR,
  ];
  maxAttempts = 1;
  delay = 0;
  logger = new Logger_js_1.Logger('GracefulDegradationStrategy');
  fallbackHandlers = new Map();
  async recover(error, context) {
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
  registerFallbackHandler(operation, handler) {
    this.fallbackHandlers.set(operation, handler);
  }
}
exports.GracefulDegradationStrategy = GracefulDegradationStrategy;
/**
 * Rate limit backoff strategy
 */
class RateLimitBackoffStrategy {
  name = 'RateLimitBackoff';
  applicableErrorCodes = [CustomErrors_js_1.ErrorCodes.RATE_LIMIT];
  maxAttempts = 3;
  delay = 5000;
  logger = new Logger_js_1.Logger('RateLimitBackoffStrategy');
  async recover(error, context) {
    const retryAfter = context.metadata?.retryAfter;
    const waitTime = retryAfter ? retryAfter * 1000 : this.delay;
    this.logger.info('Rate limited, waiting before retry', { waitTime });
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    return true;
  }
}
exports.RateLimitBackoffStrategy = RateLimitBackoffStrategy;
/**
 * Database transaction rollback strategy
 */
class DatabaseRollbackStrategy {
  name = 'DatabaseRollback';
  applicableErrorCodes = [CustomErrors_js_1.ErrorCodes.DATABASE_ERROR];
  maxAttempts = 1;
  delay = 0;
  logger = new Logger_js_1.Logger('DatabaseRollbackStrategy');
  rollbackCallback;
  constructor(rollbackCallback) {
    this.rollbackCallback = rollbackCallback;
  }
  async recover(error, context) {
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
  setRollbackCallback(callback) {
    this.rollbackCallback = callback;
  }
}
exports.DatabaseRollbackStrategy = DatabaseRollbackStrategy;
/**
 * Export all recovery strategies
 */
exports.defaultRecoveryStrategies = {
  networkReconnection: new NetworkReconnectionStrategy(),
  tokenRefresh: new TokenRefreshStrategy(),
  cacheFallback: new CacheFallbackStrategy(),
  serviceFailover: new ServiceFailoverStrategy(),
  dataSanitization: new DataSanitizationStrategy(),
  gracefulDegradation: new GracefulDegradationStrategy(),
  rateLimitBackoff: new RateLimitBackoffStrategy(),
  databaseRollback: new DatabaseRollbackStrategy(),
};
//# sourceMappingURL=RecoveryStrategies.js.map
