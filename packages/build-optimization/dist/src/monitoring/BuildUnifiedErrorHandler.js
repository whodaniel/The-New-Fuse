/**
 * Build-specific error handler implementation
 * Extends the base error handler with build-specific functionality
 */
import { BaseErrorHandler, ErrorSeverity, ErrorCategory, Logger } from '@the-new-fuse/core-error-handling';
/**
 * Build error handler implementation
 */
export class BuildUnifiedErrorHandler extends BaseErrorHandler {
    buildConfig;
    constructor(config, logger) {
        // Pass only base configuration to parent
        const baseConfig = {};
        super(baseConfig, logger || new Logger('BuildUnifiedErrorHandler'));
        this.buildConfig = {
            enableBuildOptimization: config?.enableBuildOptimization ?? true,
            enableMemoryMonitoring: config?.enableMemoryMonitoring ?? true,
            enableDependencyTracking: config?.enableDependencyTracking ?? true,
            buildTimeoutMs: config?.buildTimeoutMs ?? 300000,
            memoryThresholdMB: config?.memoryThresholdMB ?? 2048,
            maxConcurrentBuilds: config?.maxConcurrentBuilds ?? 4
        };
        this.initializeDefaultRecoveryStrategies();
    }
    /**
     * Initialize build-specific recovery strategies
     */
    initializeDefaultRecoveryStrategies() {
        // Memory exhaustion recovery strategy
        this.registerRecoveryStrategy({
            name: 'build-memory-recovery',
            applicableErrorCodes: [1001, 1002], // Memory exhaustion errors
            maxAttempts: 2,
            delay: 2000,
            recover: async (error, context) => {
                this.logger.debug('Attempting build memory recovery', {
                    packageName: error.packageName,
                    memoryUsage: error.memoryUsage,
                    memoryLimit: context.memoryLimit
                });
                return this.attemptMemoryRecovery(error, context);
            }
        });
        // Compilation error retry strategy
        this.registerRecoveryStrategy({
            name: 'build-compilation-retry',
            applicableErrorCodes: [2001, 2002, 2003], // Compilation errors
            maxAttempts: 2,
            delay: 1000,
            recover: async (error, context) => {
                this.logger.debug('Attempting build compilation retry', {
                    packageName: error.packageName,
                    compilationTarget: error.compilationTarget
                });
                return this.attemptCompilationRetry(error, context);
            }
        });
        // Dependency resolution retry strategy
        this.registerRecoveryStrategy({
            name: 'build-dependency-retry',
            applicableErrorCodes: [3001, 3002], // Dependency errors
            maxAttempts: 3,
            delay: 500,
            recover: async (error, context) => {
                this.logger.debug('Attempting build dependency retry', {
                    packageName: error.packageName,
                    buildStage: error.buildStage
                });
                return this.attemptDependencyRetry(error, context);
            }
        });
        // Build timeout recovery strategy
        this.registerRecoveryStrategy({
            name: 'build-timeout-recovery',
            applicableErrorCodes: [4001], // Timeout errors
            maxAttempts: 1,
            delay: 0,
            recover: async (error, context) => {
                this.logger.debug('Attempting build timeout recovery', {
                    packageName: error.packageName,
                    buildDuration: error.buildDuration
                });
                return this.attemptTimeoutRecovery(error, context);
            }
        });
    }
    /**
     * Initialize build-specific error handlers
     */
    initializeDefaultErrorHandlers() {
        // Memory exhaustion error handler
        this.registerErrorHandler(1001, {
            name: 'build-memory-handler',
            canHandle: (error) => error.category === ErrorCategory.SYSTEM && !!error.memoryUsage,
            handle: async (error, context) => {
                this.logger.error(`Build memory exhaustion: ${error.message}`, {
                    packageName: error.packageName,
                    memoryUsage: error.memoryUsage,
                    memoryLimit: context.memoryLimit
                });
                // Emit specific memory error event
                this.emit('memoryError', error, context);
            }
        });
        // Compilation error handler
        this.registerErrorHandler(2001, {
            name: 'build-compilation-handler',
            canHandle: (error) => !!error.compilationTarget,
            handle: async (error, context) => {
                this.logger.error(`Build compilation error: ${error.message}`, {
                    packageName: error.packageName,
                    compilationTarget: error.compilationTarget,
                    buildStage: error.buildStage
                });
                // Emit specific compilation error event
                this.emit('compilationError', error, context);
            }
        });
        // Dependency error handler
        this.registerErrorHandler(3001, {
            name: 'build-dependency-handler',
            canHandle: (error) => error.category === ErrorCategory.SYSTEM,
            handle: async (error, context) => {
                this.logger.error(`Build dependency error: ${error.message}`, {
                    packageName: error.packageName,
                    buildStage: error.buildStage
                });
                // Emit specific dependency error event
                this.emit('dependencyError', error, context);
            }
        });
        // Timeout error handler
        this.registerErrorHandler(4001, {
            name: 'build-timeout-handler',
            canHandle: (error) => !!error.buildDuration,
            handle: async (error, context) => {
                this.logger.error(`Build timeout error: ${error.message}`, {
                    packageName: error.packageName,
                    buildDuration: error.buildDuration,
                    buildStage: error.buildStage
                });
                // Emit specific timeout error event
                this.emit('timeoutError', error, context);
            }
        });
        // Generic build error handler
        this.registerErrorHandler(-1, {
            name: 'build-generic-handler',
            canHandle: () => true,
            handle: async (error, context) => {
                this.logger.debug(`Generic build handler processing error: ${error.code}`);
                // Default build error handling logic
                this.emit('buildError', error, context);
            }
        });
    }
    /**
     * Create build-specific error from generic error data
     */
    createBuildError(code, message, options = {}) {
        return {
            code,
            message,
            timestamp: new Date(),
            severity: options.severity || ErrorSeverity.MEDIUM,
            category: options.category || ErrorCategory.SYSTEM,
            retryable: options.retryable ?? true,
            packageName: options.packageName,
            buildStage: options.buildStage,
            memoryUsage: options.memoryUsage,
            buildDuration: options.buildDuration,
            compilationTarget: options.compilationTarget,
            correlationId: options.correlationId,
            metadata: options.metadata
        };
    }
    /**
     * Handle memory exhaustion errors specifically
     */
    async handleMemoryError(packageName, memoryUsage, error, context = {}) {
        const buildError = this.createBuildError(1001, `Memory exhaustion in ${packageName}: ${error.message}`, {
            severity: ErrorSeverity.CRITICAL,
            category: ErrorCategory.SYSTEM,
            packageName,
            memoryUsage,
            retryable: true
        });
        const buildContext = {
            component: 'build-system',
            operation: 'compile',
            packageName,
            ...context
        };
        await this.handleError(buildError, buildContext);
    }
    /**
     * Handle compilation errors specifically
     */
    async handleCompilationError(packageName, compilationTarget, error, context = {}) {
        const buildError = this.createBuildError(2001, `Compilation error in ${packageName}: ${error.message}`, {
            severity: ErrorSeverity.HIGH,
            category: ErrorCategory.BUSINESS,
            packageName,
            compilationTarget,
            retryable: true
        });
        const buildContext = {
            component: 'build-compiler',
            operation: 'compile',
            packageName,
            ...context
        };
        await this.handleError(buildError, buildContext);
    }
    /**
     * Handle dependency errors specifically
     */
    async handleDependencyError(packageName, error, context = {}) {
        const buildError = this.createBuildError(3001, `Dependency error in ${packageName}: ${error.message}`, {
            severity: ErrorSeverity.HIGH,
            category: ErrorCategory.SYSTEM,
            packageName,
            retryable: true
        });
        const buildContext = {
            component: 'build-dependency',
            operation: 'resolve',
            packageName,
            ...context
        };
        await this.handleError(buildError, buildContext);
    }
    /**
     * Attempt memory recovery
     */
    async attemptMemoryRecovery(error, context) {
        this.logger.info('Attempting memory recovery by reducing concurrency');
        // This would integrate with the build system to:
        // 1. Reduce concurrency level
        // 2. Enable memory cleanup
        // 3. Use memory-optimized build strategy
        // For now, return true to simulate successful recovery
        // In real implementation, this would call the build orchestrator
        return true;
    }
    /**
     * Attempt compilation retry
     */
    async attemptCompilationRetry(error, context) {
        this.logger.info('Attempting compilation retry with different settings');
        // This would integrate with the TypeScript compiler to:
        // 1. Clear compilation cache
        // 2. Use incremental compilation
        // 3. Adjust compiler options
        return false; // Placeholder - would depend on actual compilation retry logic
    }
    /**
     * Attempt dependency retry
     */
    async attemptDependencyRetry(error, context) {
        this.logger.info('Attempting dependency resolution retry');
        // This would integrate with the package manager to:
        // 1. Clear dependency cache
        // 2. Retry package resolution
        // 3. Use alternative dependency sources
        return false; // Placeholder - would depend on actual dependency retry logic
    }
    /**
     * Attempt timeout recovery
     */
    async attemptTimeoutRecovery(error, context) {
        this.logger.info('Attempting timeout recovery by adjusting build strategy');
        // This would integrate with the build orchestrator to:
        // 1. Switch to sequential builds
        // 2. Increase timeout limits
        // 3. Use staged build approach
        return true; // Placeholder - would depend on actual timeout recovery logic
    }
}
//# sourceMappingURL=BuildUnifiedErrorHandler.js.map