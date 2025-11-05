export interface LogContext {
    userId?: string;
    agentId?: string;
    workflowId?: string;
    requestId?: string;
    [key: string]: any;
}
export declare class LoggingService {
    private readonly logger;
    private context;
    /**
     * Set context for all subsequent log messages
     */
    setContext(context: LogContext): void;
    /**
     * Clear the current context
     */
    clearContext(): void;
    /**
     * Get current context
     */
    getContext(): LogContext;
    /**
     * Log info message
     */
    log(message: string, context?: LogContext): void;
    /**
     * Log error message
     */
    error(message: string, trace?: string, context?: LogContext): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log debug message
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Log verbose message
     */
    verbose(message: string, context?: LogContext): void;
    /**
     * Create a child logger with persistent context
     */
    createChildLogger(additionalContext: LogContext): LoggingService;
}
//# sourceMappingURL=logging.service.d.ts.map