/**
 * Simple Logger wrapper for the agent package
 * Provides a consistent logging interface with context support
 */
export interface LogLevel {
    ERROR: 0;
    WARN: 1;
    INFO: 2;
    DEBUG: 3;
}
export declare const LOG_LEVELS: LogLevel;
export declare class Logger {
    private context;
    private level;
    constructor(context?: string);
    private getLogLevelFromEnv;
    private formatMessage;
    private shouldLog;
    error(message: string, errorOrContext?: Error | Record<string, any>, context?: Record<string, any>): void;
    warn(message: string, errorOrContext?: Error | Record<string, any>, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    debug(message: string, errorOrContext?: Error | Record<string, any>, context?: Record<string, any>): void;
    log(message: string, context?: Record<string, any>): void;
    setContext(context: string): void;
    getContext(): string;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map