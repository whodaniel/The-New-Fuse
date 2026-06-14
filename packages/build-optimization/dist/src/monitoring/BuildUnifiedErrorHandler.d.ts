/**
 * Build-specific error handler implementation
 * Extends the base error handler with build-specific functionality
 */
import { BaseErrorHandler, BaseError, ErrorContext, ErrorSeverity, ErrorCategory, Logger } from '@the-new-fuse/core-error-handling';
/**
 * Build-specific error interface
 */
export interface BuildError extends BaseError {
    packageName?: string;
    buildStage?: string;
    memoryUsage?: number;
    buildDuration?: number;
    compilationTarget?: string;
}
/**
 * Build-specific error context
 */
export interface BuildErrorContext extends ErrorContext {
    component: string;
    operation: string;
    buildId?: string;
    packageName?: string;
    buildStage?: string;
    memoryLimit?: number;
    concurrencyLevel?: number;
    buildStrategy?: string;
}
/**
 * Build error handler configuration
 */
export interface BuildErrorHandlerConfig {
    enableBuildOptimization: boolean;
    enableMemoryMonitoring: boolean;
    enableDependencyTracking: boolean;
    buildTimeoutMs: number;
    memoryThresholdMB: number;
    maxConcurrentBuilds: number;
}
/**
 * Build error handler implementation
 */
export declare class BuildUnifiedErrorHandler extends BaseErrorHandler<BuildError, BuildErrorContext> {
    private readonly buildConfig;
    constructor(config?: Partial<BuildErrorHandlerConfig>, logger?: Logger);
    /**
     * Initialize build-specific recovery strategies
     */
    protected initializeDefaultRecoveryStrategies(): void;
    /**
     * Initialize build-specific error handlers
     */
    protected initializeDefaultErrorHandlers(): void;
    /**
     * Create build-specific error from generic error data
     */
    createBuildError(code: number, message: string, options?: {
        severity?: ErrorSeverity;
        category?: ErrorCategory;
        retryable?: boolean;
        packageName?: string;
        buildStage?: string;
        memoryUsage?: number;
        buildDuration?: number;
        compilationTarget?: string;
        correlationId?: string;
        metadata?: Record<string, any>;
    }): BuildError;
    /**
     * Handle memory exhaustion errors specifically
     */
    handleMemoryError(packageName: string, memoryUsage: number, error: Error, context?: Partial<BuildErrorContext>): Promise<void>;
    /**
     * Handle compilation errors specifically
     */
    handleCompilationError(packageName: string, compilationTarget: string, error: Error, context?: Partial<BuildErrorContext>): Promise<void>;
    /**
     * Handle dependency errors specifically
     */
    handleDependencyError(packageName: string, error: Error, context?: Partial<BuildErrorContext>): Promise<void>;
    /**
     * Attempt memory recovery
     */
    private attemptMemoryRecovery;
    /**
     * Attempt compilation retry
     */
    private attemptCompilationRetry;
    /**
     * Attempt dependency retry
     */
    private attemptDependencyRetry;
    /**
     * Attempt timeout recovery
     */
    private attemptTimeoutRecovery;
}
//# sourceMappingURL=BuildUnifiedErrorHandler.d.ts.map