/**
 * Error Recovery Strategies
 *
 * @description
 * Implements various error recovery strategies for automatic error handling
 * and system resilience.
 */
import { RecoveryStrategy, BaseError, ErrorContext } from '../interfaces/IErrorHandling.js';
/**
 * Network reconnection strategy
 */
export declare class NetworkReconnectionStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: (1000 | 1001 | 1002)[];
    maxAttempts: number;
    delay: number;
    private logger;
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
    private waitForOnline;
}
/**
 * Token refresh strategy for expired authentication tokens
 */
export declare class TokenRefreshStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: (2000 | 2001)[];
    maxAttempts: number;
    delay: number;
    private logger;
    private refreshCallback?;
    constructor(refreshCallback?: () => Promise<boolean>);
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
    setRefreshCallback(callback: () => Promise<boolean>): void;
}
/**
 * Cache fallback strategy - use cached data when fresh data is unavailable
 */
export declare class CacheFallbackStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: (1000 | 1001 | 5003)[];
    maxAttempts: number;
    delay: number;
    private logger;
    private cacheProvider?;
    constructor(cacheProvider?: (key: string) => Promise<any>);
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
    setCacheProvider(provider: (key: string) => Promise<any>): void;
}
/**
 * Service failover strategy - switch to backup service
 */
export declare class ServiceFailoverStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: (5003 | 5004)[];
    maxAttempts: number;
    delay: number;
    private logger;
    private backupServices;
    private currentServiceIndex;
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
    registerBackupService(primaryService: string, backupUrls: string[]): void;
}
/**
 * Data sanitization strategy - clean and retry with sanitized data
 */
export declare class DataSanitizationStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: (3000 | 3002)[];
    maxAttempts: number;
    delay: number;
    private logger;
    private sanitizers;
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
    registerSanitizer(dataType: string, sanitizer: (data: any) => any): void;
}
/**
 * Graceful degradation strategy - continue with reduced functionality
 */
export declare class GracefulDegradationStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: (5000 | 5003 | 5004)[];
    maxAttempts: number;
    delay: number;
    private logger;
    private fallbackHandlers;
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
    registerFallbackHandler(operation: string, handler: () => Promise<any>): void;
}
/**
 * Rate limit backoff strategy
 */
export declare class RateLimitBackoffStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: 4005[];
    maxAttempts: number;
    delay: number;
    private logger;
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
}
/**
 * Database transaction rollback strategy
 */
export declare class DatabaseRollbackStrategy implements RecoveryStrategy {
    name: string;
    applicableErrorCodes: 5001[];
    maxAttempts: number;
    delay: number;
    private logger;
    private rollbackCallback?;
    constructor(rollbackCallback?: (transactionId: string) => Promise<boolean>);
    recover(error: BaseError, context: ErrorContext): Promise<boolean>;
    setRollbackCallback(callback: (transactionId: string) => Promise<boolean>): void;
}
/**
 * Export all recovery strategies
 */
export declare const defaultRecoveryStrategies: {
    networkReconnection: NetworkReconnectionStrategy;
    tokenRefresh: TokenRefreshStrategy;
    cacheFallback: CacheFallbackStrategy;
    serviceFailover: ServiceFailoverStrategy;
    dataSanitization: DataSanitizationStrategy;
    gracefulDegradation: GracefulDegradationStrategy;
    rateLimitBackoff: RateLimitBackoffStrategy;
    databaseRollback: DatabaseRollbackStrategy;
};
//# sourceMappingURL=RecoveryStrategies.d.ts.map