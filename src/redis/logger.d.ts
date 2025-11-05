/**
 * Redis Logger
 *
 * This module provides logging functionality for the Redis implementation.
 */
import winston from 'winston';
import 'winston-daily-rotate-file';
/**
 * Log levels
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    VERBOSE = "verbose"
}
/**
 * Logger configuration
 */
export interface LoggerConfig {
    level?: LogLevel | string;
    console?: {
        enabled?: boolean;
        level?: LogLevel | string;
        colorize?: boolean;
    };
    file?: {
        enabled?: boolean;
        level?: LogLevel | string;
        path?: string;
        maxSize?: number;
        maxFiles?: number;
    };
}
/**
 * Create a logger instance
 */
export declare function createLogger(name: string, config?: LoggerConfig): winston.Logger;
export declare const redisLogger: winston.Logger;
export declare const redisClientLogger: winston.Logger;
export declare const redisServiceLogger: winston.Logger;
export default redisLogger;
//# sourceMappingURL=logger.d.ts.map