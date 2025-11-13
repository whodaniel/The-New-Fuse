/**
 * Unified error handling interfaces for all TNF systems
 */
import { EventEmitter } from 'events';
/**
 * Generic error classification
 */
export interface BaseError {
    code: number;
    message: string;
    timestamp: Date;
    correlationId?: string;
    retryable: boolean;
    severity: ErrorSeverity;
    category: ErrorCategory;
    metadata?: Record<string, any>;
}
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error categories
 */
export declare enum ErrorCategory {
    NETWORK = "network",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    VALIDATION = "validation",
    SYSTEM = "system",
    BUSINESS = "business",
    UNKNOWN = "unknown"
}
/**
 * Error context information
 */
export interface ErrorContext {
    correlationId?: string;
    component: string;
    operation: string;
    metadata?: Record<string, any>;
    requestId?: string;
    userId?: string;
    serviceId?: string;
}
/**
 * Recovery strategy interface
 */
export interface RecoveryStrategy<TError = BaseError, TContext = ErrorContext> {
    name: string;
    applicableErrorCodes: number[];
    maxAttempts: number;
    delay: number;
    recover(error: TError, context: TContext): Promise<boolean>;
}
/**
 * Recovery result
 */
export interface RecoveryResult {
    success: boolean;
    strategy: string;
    attempts: number;
    duration: number;
    data?: any;
    error?: Error;
}
/**
 * Error handler interface
 */
export interface ErrorHandler<TError = BaseError, TContext = ErrorContext> {
    name: string;
    handle(error: TError, context: TContext): Promise<void>;
    canHandle(error: TError): boolean;
}
/**
 * Error statistics
 */
export interface ErrorStatistics {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCode: Record<number, number>;
    errorRate: number;
    lastError?: Date;
    mostCommonError?: {
        code: number;
        message: string;
        count: number;
    };
}
/**
 * Generic error handler system interface
 */
export interface IErrorHandlerSystem<TError = BaseError, TContext = ErrorContext> extends EventEmitter {
    handleError(error: TError, context: TContext): Promise<RecoveryResult | null>;
    registerRecoveryStrategy(strategy: RecoveryStrategy<TError, TContext>): void;
    registerErrorHandler(errorCode: number, handler: ErrorHandler<TError, TContext>): void;
    getStatistics(): ErrorStatistics;
    getErrorHistory(limit?: number): TError[];
    clearErrorHistory(): void;
    shutdown(): void;
}
/**
 * Error pattern for pattern matching
 */
export interface ErrorPattern<TError = BaseError> {
    id: string;
    errorPatterns: RegExp[];
    errorCodes?: number[];
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    confidence: number;
    matcher(error: TError, context?: any): boolean;
}
/**
 * Error analyzer interface
 */
export interface IErrorAnalyzer<TError = BaseError, TContext = ErrorContext> {
    analyzeError(error: TError, context: TContext): ErrorAnalysis;
    addPattern(pattern: ErrorPattern<TError>): void;
    removePattern(id: string): void;
    getPatterns(): ErrorPattern<TError>[];
}
/**
 * Error analysis result
 */
export interface ErrorAnalysis {
    type: string;
    confidence: number;
    description: string;
    rootCause: string;
    recommendations: string[];
    metadata?: Record<string, any>;
}
//# sourceMappingURL=IErrorHandling.d.ts.map