/**
 * Logging infrastructure for command execution
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}
export interface LogEntry {
    readonly id: string;
    readonly timestamp: Date;
    readonly level: LogLevel;
    readonly message: string;
    readonly data?: any;
    readonly context?: LogContext;
    readonly error?: Error;
    readonly category?: string;
    readonly tags?: string[];
}
export interface LogContext {
    readonly executionId?: string;
    readonly commandType?: string;
    readonly userId?: string;
    readonly sessionId?: string;
    readonly correlationId?: string;
    readonly [key: string]: any;
}
export interface LogFormatter {
    format(entry: LogEntry): string;
}
export interface LogTransport {
    name: string;
    log(entry: LogEntry): Promise<void> | void;
    level?: LogLevel;
    enabled?: boolean;
}
/**
 * Main logger class
 */
export declare class Logger {
    private transports;
    private formatters;
    private globalContext;
    private globalTags;
    private minLevel;
    constructor(minLevel?: LogLevel);
    /**
     * Log a debug message
     */
    debug(message: string, data?: any, context?: LogContext): void;
    /**
     * Log an info message
     */
    info(message: string, data?: any, context?: LogContext): void;
    /**
     * Log a warning message
     */
    warn(message: string, data?: any, context?: LogContext): void;
    /**
     * Log an error message
     */
    error(message: string, error?: Error, data?: any, context?: LogContext): void;
    /**
     * Log a fatal message
     */
    fatal(message: string, error?: Error, data?: any, context?: LogContext): void;
    /**
     * Log a message with specific level
     */
    log(level: LogLevel, message: string, data?: any, context?: LogContext, error?: Error): void;
    /**
     * Add a transport
     */
    addTransport(transport: LogTransport): void;
    /**
     * Remove a transport
     */
    removeTransport(name: string): boolean;
    /**
     * Get all transports
     */
    getTransports(): LogTransport[];
    /**
     * Register a formatter
     */
    registerFormatter(name: string, formatter: LogFormatter): void;
    /**
     * Get a formatter
     */
    getFormatter(name: string): LogFormatter | undefined;
    /**
     * Set global context
     */
    setGlobalContext(context: LogContext): void;
    /**
     * Update global context
     */
    updateGlobalContext(context: Partial<LogContext>): void;
    /**
     * Set global tags
     */
    setGlobalTags(tags: string[]): void;
    /**
     * Add global tags
     */
    addGlobalTags(tags: string[]): void;
    /**
     * Set minimum log level
     */
    setMinLevel(level: LogLevel): void;
    /**
     * Get minimum log level
     */
    getMinLevel(): LogLevel;
    /**
     * Create a child logger with additional context
     */
    child(context: LogContext, tags?: string[]): Logger;
    /**
     * Write log entry to all transports
     */
    private writeToTransports;
    /**
     * Register default formatters
     */
    private registerDefaultFormatters;
}
/**
 * JSON log formatter
 */
export declare class JsonFormatter implements LogFormatter {
    format(entry: LogEntry): string;
}
/**
 * Simple text formatter
 */
export declare class SimpleFormatter implements LogFormatter {
    format(entry: LogEntry): string;
}
//# sourceMappingURL=logger.d.ts.map