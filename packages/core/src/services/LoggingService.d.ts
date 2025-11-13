import { LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: string;
    metadata?: Record<string, any>;
    error?: Error;
}
export interface LoggingConfig {
    logLevel: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    logFilePath?: string;
    maxFileSize?: number;
    maxFiles?: number;
}
export declare class LoggingService implements LoggerService {
    private readonly configService;
    private readonly logger;
    private config;
    private logEntries;
    private readonly maxMemoryLogs;
    constructor(configService: ConfigService);
    private initializeConfig;
    log(message: string, context?: string, metadata?: Record<string, any>): void;
    /**
     * Log an error message with optional error object, context, and metadata
     * @param message - The error message
     * @param error - Optional Error object for stack trace preservation
     * @param context - Optional context/module name
     * @param metadata - Optional metadata object
     */
    error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void;
    /**
     * @deprecated Use error(message, error?, context?, metadata?) instead
     * Legacy signature for backward compatibility
     */
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string, metadata?: Record<string, any>): void;
    debug(message: string, context?: string, metadata?: Record<string, any>): void;
    verbose(message: string, context?: string, metadata?: Record<string, any>): void;
    private writeLog;
    private shouldLog;
    private logToConsole;
    private logToFile;
    private formatLogEntry;
    getRecentLogs(count?: number): LogEntry[];
    getLogsByLevel(level: LogLevel): LogEntry[];
    getLogsByContext(context: string): LogEntry[];
    clearLogs(): void;
    getLogStatistics(): Record<string, number>;
    logPerformance(operation: string, duration: number, context?: string): void;
    logError(error: Error, context?: string, metadata?: Record<string, any>): void;
    logSecurity(event: string, userId?: string, metadata?: Record<string, any>): void;
    logBusiness(event: string, data?: Record<string, any>, context?: string): void;
    /**
     * Safely log errors from unknown types using the getErrorMessage utility
     * Use this method when catching unknown error types in catch blocks
     * @param message - The error message
     * @param error - Unknown error type (will be safely converted)
     * @param context - Optional context/module name
     * @param metadata - Optional metadata object
     */
    logErrorSafe(message: string, error: unknown, context?: string, metadata?: Record<string, any>): void;
}
export default LoggingService;
//# sourceMappingURL=LoggingService.d.ts.map