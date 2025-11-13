/**
 * Comprehensive MCP Error Handling System
 * Implements error classification, recovery strategies, and monitoring
 */
import { EventEmitter } from 'events';
import { MCPErrorClass, ErrorRecoveryStrategy, ErrorStatistics } from '../types/error';
import { Logger } from '../utils/Logger';
export interface ErrorHandlerConfig {
    /** Enable automatic error recovery */
    enableAutoRecovery: boolean;
    /** Maximum recovery attempts per error */
    maxRecoveryAttempts: number;
    /** Error statistics collection interval (ms) */
    statisticsInterval: number;
    /** Enable error logging */
    enableLogging: boolean;
    /** Log level for errors */
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    /** Custom error handlers */
    customHandlers?: Map<number, ErrorHandler>;
}
export interface ErrorContext {
    /** Correlation ID for tracking */
    correlationId?: string;
    /** Component where error occurred */
    component: string;
    /** Operation being performed */
    operation: string;
    /** Additional context data */
    metadata?: Record<string, any>;
    /** Request ID if applicable */
    requestId?: string;
    /** User ID if applicable */
    userId?: string;
    /** Service ID if applicable */
    serviceId?: string;
}
export interface ErrorHandler {
    /** Handler name */
    name: string;
    /** Handle the error */
    handle: (error: MCPErrorClass, context: ErrorContext) => Promise<void>;
    /** Check if handler can handle this error */
    canHandle: (error: MCPErrorClass) => boolean;
}
export interface RecoveryResult {
    /** Whether recovery was successful */
    success: boolean;
    /** Recovery strategy used */
    strategy: string;
    /** Number of attempts made */
    attempts: number;
    /** Time taken for recovery (ms) */
    duration: number;
    /** Additional result data */
    data?: any;
    /** Error if recovery failed */
    error?: Error;
}
/**
 * Main MCP Error Handler class
 */
export declare class MCPErrorHandler extends EventEmitter {
    private readonly config;
    private readonly logger;
    private readonly recoveryStrategies;
    private readonly errorHandlers;
    private readonly statistics;
    private readonly errorHistory;
    private statisticsTimer?;
    constructor(config?: Partial<ErrorHandlerConfig>, logger?: Logger);
    /**
     * Handle an MCP error
     */
    handleError(error: MCPErrorClass, context: ErrorContext): Promise<RecoveryResult | null>;
    /**
     * Register a custom error recovery strategy
     */
    registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * Get error statistics
     */
    getStatistics(): ErrorStatistics;
    /**
     * Get error history
     */
    getErrorHistory(limit?: number): MCPErrorClass[];
    /**
     * Clear error history
     */
    clearErrorHistory(): void;
    /**
     * Shutdown the error handler
     */
    shutdown(): void;
    /**
     * Attempt error recovery
     */
    private attemptRecovery;
}
//# sourceMappingURL=MCPErrorHandler.d.ts.map